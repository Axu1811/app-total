import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; 
import { Router } from '@angular/router'; 
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, 
  IonLabel, IonInput, IonButton, IonIcon, IonButtons, IonCard,
  IonCardHeader, IonCardTitle, IonCardContent, ToastController, 
  IonThumbnail, IonCol, IonRow 
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TiendaService, Product } from '../../services/tienda.service';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  cloudUploadOutline,
  saveOutline, 
  addOutline, 
  refreshOutline,
  removeCircleOutline, 
  addCircleOutline, 
  trashOutline,
  downloadOutline,
  logOutOutline,   // <-- FALTABA REGISTRAR PARA EL HEADER
  linkOutline      // <-- FALTABA REGISTRAR PARA EL INPUT DE IMAGEN
} from 'ionicons/icons';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [
    IonRow, IonCol, 
    CommonModule, 
    FormsModule, 
    RouterLink, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonInput, 
    IonButton, 
    IonIcon, 
    IonButtons, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardContent,
    IonThumbnail
  ]
})
export class AdminPage implements OnInit {
  private tiendaService = inject(TiendaService);
  private toastController = inject(ToastController);
  private authService = inject(AuthService);
  private router = inject(Router);

  newProduct: Product = {
    code: '',
    name: '',
    price: 0,
    stock: 0,
    image: '',
    description: ''
  };
  
  allProducts: Product[] = [];

  constructor() {
    // Registro de todos los íconos utilizados en el HTML
    addIcons({ 
      arrowBackOutline, 
      saveOutline, 
      addOutline, 
      refreshOutline, 
      removeCircleOutline, 
      addCircleOutline, 
      trashOutline,
      downloadOutline,
      cloudUploadOutline,
      logOutOutline,
      linkOutline
    });
  }

  ngOnInit() {
    this.tiendaService.getProducts().subscribe(data => {
      this.allProducts = data;
    });
  }

  descargarPlantilla() {
    const modeloExcel = [
      {
        codigo: 'TMT001',
        nombre: 'Taladro Percutor 20V Total',
        precio: 299.90,
        stock: 5,
        imagen_url: 'https://ejemplo.com/foto.jpg',
        descripcion: 'Incluye batería y cargador'
      }
    ];

    try {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(modeloExcel);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      XLSX.writeFile(wb, 'Plantilla_Carga_Total.xlsx');
      this.mostrarToast('Plantilla descargada', 'success');
    } catch (error) {
      this.mostrarToast('Error al generar Excel', 'danger');
    }
  }

  async subirExcel(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        let subidos = 0;
        for (const item of jsonData) {
          const product: Product = {
            code: String(item.codigo || ''),
            name: String(item.nombre || ''),
            price: Number(item.precio || 0),
            stock: Number(item.stock || 0),
            image: String(item.imagen_url || ''),
            description: String(item.descripcion || '')
          };

          if (product.name && product.code) {
            await this.tiendaService.addProduct(product);
            subidos++;
          }
        }

        this.mostrarToast(`${subidos} productos cargados con éxito`, 'success');
        event.target.value = ''; 
      } catch (error) {
        this.mostrarToast('Error al procesar el archivo Excel', 'danger');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/welcome']); 
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  }

  async saveProduct() {
    if (!this.newProduct.name || !this.newProduct.code) {
      this.mostrarToast('Por favor completa los campos básicos', 'warning');
      return;
    }
    try {
      await this.tiendaService.addProduct(this.newProduct);
      this.mostrarToast('Producto registrado con éxito', 'success');
      this.resetForm(); 
    } catch (error) {
      this.mostrarToast('Error al guardar el producto', 'danger');
    }
  }

  async updateProductStock(product: Product, change: number) {
    const oldStock = product.stock;
    const newStock = oldStock + change;
    if (newStock < 0) {
      this.mostrarToast('El stock no puede ser menor a 0', 'warning');
      return;
    }
    try {
      await this.tiendaService.updateStock(product.id!, newStock, product.name, oldStock);
    } catch (error) {
      this.mostrarToast('Error al actualizar stock', 'danger');
    }
  }

  async deleteProduct(product: Product) {
    if (confirm(`¿Eliminar ${product.name}?`)) {
      try {
        await this.tiendaService.deleteProduct(product.id!);
        this.mostrarToast('Producto eliminado', 'dark');
      } catch (error) {
        this.mostrarToast('Error al eliminar', 'danger');
      }
    }
  }

  resetForm() {
    this.newProduct = { code: '', name: '', price: 0, stock: 0, image: '', description: '' };
  }

  async mostrarToast(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg, duration: 2000, color: color
    });
    toast.present();
  }
}