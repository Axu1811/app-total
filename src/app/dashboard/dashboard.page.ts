import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonTextarea, 
  IonGrid, IonRow, IonCol, IonButtons, IonCard, IonCardContent, 
  IonList, IonBadge, ToastController, LoadingController, AlertController, IonSearchbar, IonNote } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  saveOutline, imageOutline, barcodeOutline, hammerOutline, logOutOutline, 
  cashOutline, cubeOutline, pricetagOutline, addCircle, removeCircle, 
  trashOutline, alertCircleOutline, searchOutline, statsChartOutline, 
  closeCircle, timeOutline, cloudUploadOutline, lockClosedOutline, lockOpenOutline,
  lockClosed, scanOutline, shieldCheckmarkOutline, gridOutline, layersOutline, mapOutline, listOutline, cameraOutline, pencilOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { TiendaService, Product } from '../services/tienda.service';
import * as XLSX from 'xlsx';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [ZXingScannerModule, IonNote, CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon, IonTextarea, IonGrid, IonRow, IonCol, IonButtons, IonCard, IonCardContent, IonList, IonBadge, IonSearchbar]
})
export class DashboardPage implements OnInit {
  // --- SEGURIDAD ---
  esAdministrador: boolean = false;
  allProducts: any[] = []; 
  filteredProducts: any[] = []; 
  isAdmin: boolean = true;

  // Formulario
  code: string = '';
  name: string = '';
  price: any = null;
  stock: any = null;
  image: string = '';
  description: string = '';
  estante: string = '';
  fila: string = '';

  // --- VARIABLES PARA EL MAPA ---
  mostrarMapa: boolean = false;
  estantesDisponibles: string[] = ['A', 'B', 'C', 'D', 'E'];

  // Datos
  fullInventory: Product[] = [];
  displayedInventory: Product[] = [];
  searchTerm: string = '';

  // Edición rápida (NUEVA VARIABLE)
  editId: string | null = null;

  // Estadísticas
  totalValue: number = 0;
  lowStockCount: number = 0;

  // Scanner
  mostrarCamara: boolean = false;
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE, BarcodeFormat.EAN_13, BarcodeFormat.CODE_128, BarcodeFormat.DATA_MATRIX];

  private tiendaService = inject(TiendaService);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({statsChartOutline,cloudUploadOutline,timeOutline,logOutOutline,closeCircle,cubeOutline,cashOutline,alertCircleOutline,barcodeOutline,scanOutline,pricetagOutline,gridOutline,layersOutline,imageOutline,addCircle,trashOutline,searchOutline,cameraOutline,pencilOutline,checkmarkCircleOutline,closeCircleOutline,lockClosedOutline,shieldCheckmarkOutline,listOutline,mapOutline,saveOutline,hammerOutline,removeCircle,lockOpenOutline,lockClosed});
  }

  ngOnInit() {
    this.tiendaService.getProducts().subscribe(data => {
      this.fullInventory = data;
      this.calculateStats();
      this.filterInventory(); 
    });
  }

  // --- LÓGICA DE ESCANEO ---
  escanearConCamara() {
    this.mostrarCamara = true;
  }

  onScanSuccess(result: string) {
    this.mostrarCamara = false;
    this.code = result;
    this.buscarPorCodigo();
  }

  buscarPorCodigo() {
    if (!this.code) return;
    const productoEncontrado = this.fullInventory.find(
      p => p.code.toLowerCase() === this.code.toLowerCase()
    );
    if (productoEncontrado) {
      this.name = productoEncontrado.name;
      this.price = productoEncontrado.price;
      this.description = productoEncontrado.description || '';
      this.image = productoEncontrado.image || '';
      this.estante = productoEncontrado.estante || '';
      this.fila = productoEncontrado.fila || '';
      this.mostrarMensaje(`Producto: ${this.name}`, 'primary');
      this.playBeep(); 
    } else {
      this.mostrarMensaje('Código nuevo detectado', 'warning');
    }
  }

  playBeep() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) { console.log('Audio no soportado'); }
  }

  // --- LÓGICA DE ACCESO ---
  abrirLoginAdmin() {
    if (this.esAdministrador) {
      this.esAdministrador = false;
      this.mostrarMensaje('Sesión cerrada', 'medium');
      return;
    }
    const pass = prompt('Ingrese clave de administrador:');
    if (pass?.toUpperCase() === 'TOTAL2024') {
      this.esAdministrador = true;
      this.mostrarMensaje('Acceso concedido', 'success');
    } else if (pass !== null) {
      this.mostrarMensaje('Clave incorrecta', 'danger');
    }
  }

  // --- CARGA MASIVA EXCEL ---
async cargarExcel(event: any) {
  const file = event.target.files[0];
  if (!file) return;

  const loading = await this.loadingController.create({ 
    message: 'Sincronizando inventario...',
    spinner: 'crescent' 
  });
  await loading.present();

  const reader = new FileReader();
  reader.onload = async (e: any) => {
    try {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convertimos a JSON asegurando que lea los datos tal cual
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      for (const fila of jsonData) {
        // Función para buscar la columna correcta sin importar espacios o mayúsculas
        const getVal = (targets: string[]) => {
          const key = Object.keys(fila).find(k => 
            targets.includes(k.toUpperCase().trim().replace(/\s/g, ''))
          );
          return key ? fila[key] : null;
        };

        // Función para limpiar y forzar el número (quita S/., comas, espacios)
        const aNumero = (val: any) => {
          if (val === null || val === undefined) return 0;
          const limpio = String(val).replace(/[^0-9.]/g, '');
          const res = parseFloat(limpio);
          return isNaN(res) ? 0 : res;
        };

        const prod: Product = {
          code: String(getVal(['CODIGO', 'CÓDIGO', 'CODE', 'SKU']) || '').trim(),
          name: String(getVal(['PRODUCTO', 'NOMBRE', 'NAME', 'ARTICULO']) || '').trim(),
          price: aNumero(getVal(['PRECIO', 'COSTO', 'PRICE'])),
          stock: aNumero(getVal(['EXISTENCIAS', 'STOCK', 'CANTIDAD', 'CANT'])),
          image: String(getVal(['IMAGEN', 'IMAGE', 'FOTO', 'URL']) || 'https://via.placeholder.com/150'),
          description: String(getVal(['DESCRIPCION', 'DETALLE', 'DESCRIPTION']) || ''),
          estante: String(getVal(['ESTANTE', 'UBICACION', 'SHELF']) || '').trim(),
          fila: String(getVal(['FILA', 'ROW', 'NIVEL']) || '').trim()
        };

        // Solo subir si hay un nombre de producto válido
        if (prod.name && prod.name !== 'undefined' && prod.name !== '') {
          await this.tiendaService.addProduct(prod);
        }
      }

      this.mostrarMensaje('¡Carga masiva completada con éxito!', 'success');
    } catch (error) {
      console.error("Error en carga:", error);
      this.mostrarMensaje('Error al leer el Excel. Verifica el formato.', 'danger');
    } finally {
      loading.dismiss();
      event.target.value = ''; // Reset para poder subir el mismo archivo si se corrige
    }
  };
  reader.readAsArrayBuffer(file);
}
  filterInventory() {
    const query = this.searchTerm.toLowerCase();
    if (!query) {
      this.displayedInventory = this.fullInventory;
    } else {
      this.displayedInventory = this.fullInventory.filter(p => 
        p.name.toLowerCase().includes(query) || (p.code && p.code.toLowerCase().includes(query))
      );
    }
  }

  calculateStats() {
    this.totalValue = this.fullInventory.reduce((acc, curr) => acc + (Number(curr.price) * Number(curr.stock)), 0);
    this.lowStockCount = this.fullInventory.filter(p => p.stock < 5).length;
  }

  async saveProduct() {
    if (!this.code || !this.name || !this.price || this.stock === null) {
      this.mostrarMensaje('Faltan datos obligatorios', 'warning');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Procesando...', spinner: 'crescent' });
    await loading.present();

    try {
      const newProduct: Product = {
        code: this.code,
        name: this.name,
        price: Number(this.price),
        stock: Number(this.stock),
        description: this.description || '',
        image: this.image || 'https://via.placeholder.com/150',
        estante: this.estante || '', 
        fila: this.fila || ''
      };

      await this.tiendaService.addProduct(newProduct);
      loading.dismiss();
      this.mostrarMensaje('¡Producto registrado!', 'success');
      this.limpiarFormulario();

    } catch (error) {
      loading.dismiss();
      this.mostrarMensaje('Error al guardar', 'danger');
    }
  }

  async updateStock(product: Product, event: any) {
    if (!product.id) return;
    const val = parseInt(event.target.value, 10);
    if (val < 0) {
      this.mostrarMensaje('Stock no puede ser negativo', 'warning');
      event.target.value = product.stock; 
      return;
    }
    try {
      await this.tiendaService.updateStock(product.id, val, product.name, product.stock);
    } catch (error) {
      this.mostrarMensaje('Error de conexión', 'danger');
    }
  }

  async confirmDelete(product: Product) {
    const alert = await this.alertController.create({
      header: 'Eliminar Producto',
      message: `¿Borrar <strong>${product.name}</strong> permanentemente?`,
      mode: 'ios',
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'secondary' }, 
        { 
          text: 'Borrar', 
          role: 'destructive', 
          handler: () => this.deleteProduct(product) 
        }
      ]
    });
    await alert.present();
  }

  async deleteProduct(product: any) {
    if (!product.id) return;
    try {
      await this.tiendaService.deleteProduct(product.id);
      this.fullInventory = this.fullInventory.filter((p: any) => p.id !== product.id);
      this.filterInventory();
      this.mostrarMensaje('Eliminado correctamente', 'success');
    } catch (error) {
      this.mostrarMensaje('Error al eliminar', 'danger');
    }
  }

  async borrarTodoElCatalogo() {
    const alert = await this.alertController.create({
      header: '¿Vaciar Catálogo?',
      message: 'Se eliminarán permanentemente <strong>TODOS</strong> los productos de la base de datos. ¿Estás seguro?',
      mode: 'ios',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar Todo',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({ message: 'Vaciando catálogo...' });
            await loading.present();
            try {
              await this.tiendaService.borrarColeccionCompleta('productos'); 
              this.fullInventory = [];
              this.filterInventory();
              this.calculateStats();
              this.mostrarMensaje('Inventario vaciado por completo', 'warning');
            } catch (e) {
              this.mostrarMensaje('Error al vaciar el inventario', 'danger');
            } finally {
              loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  adjustStockLocal(product: Product, amount: number) {
    if (!product.id) return;
    const newStock = (product.stock || 0) + amount;
    if (newStock >= 0) {
      this.tiendaService.updateStock(product.id, newStock, product.name, product.stock);
    }
  }

  limpiarFormulario() {
    this.code = ''; 
    this.name = ''; 
    this.price = null; 
    this.stock = null; 
    this.image = ''; 
    this.description = '';
    this.estante = '';
    this.fila = '';
  }

  async mostrarMensaje(mensaje: string, color: 'success' | 'danger' | 'warning' | 'medium' | 'primary') {
    const toast = await this.toastController.create({
      message: mensaje, 
      duration: 2000, 
      color: color, 
      position: 'top'
    });
    await toast.present();
  }

  // --- LÓGICA PARA ORGANIZAR EL MAPA ---
  getProductsByShelf(shelf: string) {
    return this.fullInventory.filter(p => p.estante === shelf);
  }

  // --- NUEVAS FUNCIONES DE EDICIÓN RÁPIDA (PASO 2) ---

  activarEdicion(product: Product) {
    this.editId = product.id!;
  }

  cancelarEdicion() {
    this.editId = null;
    // Recargamos el inventario para asegurar que los datos locales vuelvan a su estado original
    this.filterInventory();
  }

  async guardarCambiosRapidos(product: Product) {
    if (!product.id) return;

    const loading = await this.loadingController.create({ message: 'Guardando...', spinner: 'crescent' });
    await loading.present();

    try {
      // Usamos el servicio para actualizar solo los campos necesarios
      await this.tiendaService.updateProductFields(product.id, {
        estante: product.estante || '',
        fila: product.fila || '',
        image: product.image || 'https://via.placeholder.com/150'
      });

      this.editId = null;
      this.mostrarMensaje('Cambios guardados', 'success');
    } catch (error) {
      this.mostrarMensaje('Error al guardar', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  async editImage(product: Product) {
    const alert = await this.alertController.create({
      header: 'URL de la Imagen',
      subHeader: 'Pega el enlace de la nueva foto',
      inputs: [
        {
          name: 'imageUrl',
          type: 'url',
          value: product.image,
          placeholder: 'https://ejemplo.com/herramienta.jpg'
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Actualizar',
          handler: (data) => {
            product.image = data.imageUrl;
          }
        }
      ]
    });
    await alert.present();
  }
}