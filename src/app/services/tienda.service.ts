import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, Firestore, onSnapshot, 
  doc, updateDoc, deleteDoc, query, orderBy, limit, getDoc,
  writeBatch, getDocs // Importados para el borrado masivo
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // <--- IMPORTANTE PARA ROLES
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

// --- INTERFACES EXPORTADAS ---
export interface Product {
  id?: string;
  code: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  estante?: string; 
  fila?: string;
}

export interface StockLog {
  date: any;
  productName: string;
  action: 'create' | 'update' | 'delete';
  detail: string;
}

export interface Venta {
  id?: string;
  fecha: any; 
  productos: DetalleVenta[];
  totalVendido: number;
  totalCosto: number;
  ganancia: number;
}

export interface DetalleVenta {
  productId: string;
  nombre: string;
  cantidad: number;
  precioVenta: number;
  precioCosto: number;
}

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private db: Firestore;

  constructor() {
    const app = initializeApp((environment as any).firebaseConfig);
    this.db = getFirestore(app);
  }

  // ==========================================
  // GESTIÓN DE ROLES Y SEGURIDAD
  // ==========================================

  getUserRole(): Observable<string> {
    return new Observable((observer) => {
      const auth = getAuth();
      const checkUser = setInterval(() => {
        const user = auth.currentUser;
        if (user) {
          clearInterval(checkUser);
          const userRef = doc(this.db, 'users', user.uid);
          getDoc(userRef).then((snapshot) => {
            if (snapshot.exists()) {
              observer.next(snapshot.data()['rol'] || 'usuario');
            } else {
              observer.next('usuario');
            }
          }).catch(() => observer.next('usuario'));
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkUser);
        if (!auth.currentUser) observer.next('invitado');
      }, 3000);
    });
  }

  // ==========================================
  // FUNCIONES PARA ESCANEO REMOTO
  // ==========================================

  async notificarEscaneo(codigo: string) {
    const docRef = doc(this.db, 'configuracion', 'ultimo_escaneo');
    return updateDoc(docRef, { 
      codigo: codigo, 
      fecha: Date.now() 
    });
  }

  escucharEscaneoRemoto(): Observable<any> {
    return new Observable((observer) => {
      const docRef = doc(this.db, 'configuracion', 'ultimo_escaneo'); 
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
          observer.next(snapshot.data());
        }
      }, (error) => observer.error(error));
      return () => unsubscribe();
    });
  }

  // ==========================================
  // GESTIÓN DE PRODUCTOS E INVENTARIO
  // ==========================================

  addProduct(product: Product) {
    const productsRef = collection(this.db, 'products');
    this.addLog({
      date: new Date(),
      productName: product.name,
      action: 'create',
      detail: `Ingreso inicial: ${product.stock} u. | Ubicación: ${product.estante || 'N/A'}-${product.fila || 'N/A'}`
    });
    return addDoc(productsRef, product);
  }

  getProducts(): Observable<Product[]> {
    return new Observable((observer) => {
      const productsRef = collection(this.db, 'products');
      const unsubscribe = onSnapshot(productsRef, (snapshot) => {
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        observer.next(products);
      }, (error) => observer.error(error));
      return () => unsubscribe();
    });
  }

  /**
   * ACTUALIZACIÓN DE STOCK Y DATOS (Incluye estante y fila)
   */
  updateStock(productId: string, newStock: number, productName: string, oldStock: number, extraData: any = {}) {
    const productRef = doc(this.db, 'products', productId);
    const diferencia = newStock - oldStock;
    const tipoAccion = diferencia > 0 ? 'Entrada' : 'Salida';
    const cantidadMovida = Math.abs(diferencia);

    if (diferencia !== 0) {
      this.addLog({
        date: new Date(),
        productName: productName,
        action: 'update',
        detail: `${tipoAccion}: ${cantidadMovida} u. | Stock Resultante: ${newStock}`
      });
    }

    return updateDoc(productRef, { 
      stock: newStock,
      ...extraData 
    });
  }

  /**
   * ACTUALIZACIÓN RÁPIDA DE CAMPOS (Edición desde lista)
   */
  async updateProductFields(productId: string, data: Partial<Product>) {
    const productRef = doc(this.db, 'products', productId);
    
    // Opcional: Log del cambio de ubicación o imagen
    this.addLog({
      date: new Date(),
      productName: 'Producto ID: ' + productId,
      action: 'update',
      detail: `Edición rápida: ${data.estante ? 'Ub: ' + data.estante + '-' + data.fila : 'Imagen actualizada'}`
    });

    return updateDoc(productRef, data);
  }

  deleteProduct(productId: string) {
    if (!productId) return Promise.reject("Sin ID");
    const productRef = doc(this.db, 'products', productId);
    
    this.addLog({
      date: new Date(),
      productName: 'Producto ID: ' + productId,
      action: 'delete',
      detail: 'Producto eliminado permanentemente'
    });

    return deleteDoc(productRef);
  }

  async borrarColeccionCompleta(coleccion: string) {
    const productsRef = collection(this.db, coleccion);
    const snapshot = await getDocs(productsRef);
    const batch = writeBatch(this.db);

    snapshot.docs.forEach((documento) => {
      batch.delete(documento.ref);
    });

    this.addLog({
      date: new Date(),
      productName: 'SISTEMA',
      action: 'delete',
      detail: `Vaciado total de catálogo (${snapshot.size} productos)`
    });

    return await batch.commit();
  }

  // ==========================================
  // NUEVAS FUNCIONES DE VENTAS
  // ==========================================

  async registrarVenta(venta: Venta) {
    const ventasRef = collection(this.db, 'ventas');
    return addDoc(ventasRef, {
      ...venta,
      fecha: new Date().toISOString()
    });
  }

  getVentas(): Observable<Venta[]> {
    return new Observable((observer) => {
      const ventasRef = collection(this.db, 'ventas');
      const q = query(ventasRef, orderBy('fecha', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const ventas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Venta[];
        observer.next(ventas);
      }, (error) => observer.error(error));
      return () => unsubscribe();
    });
  }

  // ==========================================
  // FUNCIONES DE HISTORIAL Y LOGS
  // ==========================================

  private addLog(log: StockLog) {
    const logsRef = collection(this.db, 'history');
    return addDoc(logsRef, {
      ...log,
      date: new Date().toISOString()
    });
  }

  getLogs(): Observable<StockLog[]> {
    return new Observable((observer) => {
      const logsRef = collection(this.db, 'history');
      const q = query(logsRef, orderBy('date', 'desc'), limit(50));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => doc.data() as StockLog);
        observer.next(logs);
      }, (error) => observer.error(error));
      return () => unsubscribe();
    });
  }
}