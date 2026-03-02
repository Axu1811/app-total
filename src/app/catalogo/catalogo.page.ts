import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, 
  IonButton, IonIcon, IonSearchbar, IonButtons, IonBadge, 
  IonModal, IonList, IonItem, IonLabel, IonAvatar, IonFooter,
  IonChip, ToastController, IonInput, IonThumbnail, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonSpinner,
  AlertController, LoadingController 
} from '@ionic/angular/standalone';
import { TiendaService, Product } from '../services/tienda.service';
import { addIcons } from 'ionicons';
import { 
  cartOutline, arrowBackOutline, searchOutline, star, filterOutline, 
  logoWhatsapp, trashOutline, closeOutline, sendOutline, 
  documentTextOutline, addCircleOutline, removeCircleOutline, 
  informationCircleOutline, hammerOutline, closeCircle, add, 
  addOutline, removeOutline, download, cubeOutline, alertCircleOutline,
  personCircleOutline, downloadOutline, personOutline, cardOutline, receiptOutline,
  close, trashBinOutline, cloudUploadOutline 
} from 'ionicons/icons';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuoteItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: true,
  imports: [
    IonSpinner, CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, 
    IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, 
    IonCardContent, IonButton, IonIcon, IonSearchbar, IonButtons, 
    IonBadge, IonModal, IonList, IonItem, IonLabel, IonAvatar, 
    IonFooter, IonChip, IonInput, IonThumbnail, IonCardHeader, 
    IonCardTitle, IonCardSubtitle
  ]
})
export class CatalogoPage implements OnInit {
  
  allProducts: any[] = [];
  filteredProducts: any[] = []; 
  searchTerm: string = '';
  isAdmin: boolean = true; 
  
  categories = ['Todo', 'Taladros', 'Sierras', 'Amoladoras', 'Kits', 'Accesorios'];
  selectedCategory = 'Todo';
  quoteCart: QuoteItem[] = [];
  isModalOpen = false;
  phoneNumber = '51908885683'; 

  totalItemsInCart: number = 0;
  totalQuoteAmount: number = 0; 

  datosCliente = {
    nombre: '',
    documento: ''
  };

  private tiendaService = inject(TiendaService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private loadingController = inject(LoadingController);

  constructor() {
    addIcons({
      arrowBackOutline, cartOutline, searchOutline, add, receiptOutline, 
      close, personOutline, cardOutline, trashOutline, documentTextOutline, 
      logoWhatsapp, closeOutline, removeOutline, addOutline, hammerOutline, 
      cubeOutline, personCircleOutline, downloadOutline, closeCircle, 
      alertCircleOutline, informationCircleOutline, download, addCircleOutline, 
      star, filterOutline, sendOutline, removeCircleOutline,
      trashBinOutline, cloudUploadOutline
    });
  }

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.tiendaService.getProducts().subscribe({
      next: (data) => {
        this.allProducts = data;
        this.applyFilters();
      },
      error: () => this.mostrarMensaje('Error al conectar con el servidor', 'danger')
    });
  }

  // --- GESTIÓN DE CARRITO ---

  addToQuote(product: Product) {
    const existingItem = this.quoteCart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        existingItem.quantity += 1;
        this.mostrarMensaje(`+1 ${product.name} agregado`, 'success');
      } else {
        this.mostrarMensaje(`Stock máximo alcanzado (${product.stock})`, 'warning');
      }
    } else {
      if (product.stock > 0) {
        this.quoteCart.push({ product: product, quantity: 1 });
        this.mostrarMensaje('Producto añadido a la lista', 'success');
      } else {
        this.mostrarMensaje('Sin stock disponible', 'danger');
      }
    }
    this.calculateQuoteTotal(); 
  }

  updateQuantity(item: QuoteItem, change: number) {
    const newQuantity = Number(item.quantity) + change;
    
    if (newQuantity >= 1) {
      if (newQuantity <= item.product.stock) {
        item.quantity = newQuantity;
      } else {
        this.mostrarMensaje('No hay más stock disponible', 'warning');
      }
    }
    this.calculateQuoteTotal(); 
  }

  removeFromQuote(item: QuoteItem) {
    this.quoteCart = this.quoteCart.filter(i => i.product.id !== item.product.id);
    this.calculateQuoteTotal(); 
    this.mostrarMensaje('Eliminado de la lista', 'danger');
  }

  calculateQuoteTotal() {
    this.totalItemsInCart = this.quoteCart.reduce((sum, item) => sum + item.quantity, 0);
    this.totalQuoteAmount = this.quoteCart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }

  // --- FILTROS Y UI ---

  filterProducts(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    this.applyFilters(); 
  }

  applyFilters() {
    let temp = [...this.allProducts];
    if (this.searchTerm.trim() !== '') {
      const q = this.searchTerm.toLowerCase();
      temp = temp.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.code && p.code.toLowerCase().includes(q))
      );
    }
    this.filteredProducts = temp;
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if(isOpen) this.calculateQuoteTotal(); 
  }

  formatoPrecio(precio: number): string {
    return `S/. ${precio.toFixed(2)}`;
  }

  // --- EXPORTACIÓN Y VENTA (MODIFICADO) ---

  async generarPDF() {
    if (this.quoteCart.length === 0) return;

    try {
      const doc = new jsPDF();
      const fechaActual = new Date().toLocaleDateString();
      const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      doc.setFontSize(8);
      doc.text(`${fechaActual}, ${horaActual}`, 14, 10);
      doc.text('Marketing System', 105, 10, { align: 'center' });

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL TOOLS PERU', 40, 25);
      doc.text('Venta', 160, 25);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre del cliente: ${this.datosCliente.nombre || '---'}`, 14, 35);
      doc.text(`Número de pedido: QT-${Math.floor(Math.random() * 1000000)}`, 120, 35);
      doc.text(`Documento: ${this.datosCliente.documento || '---'}`, 14, 42); 
      doc.text(`Fecha de pedido: ${fechaActual}`, 120, 42);

      const tableRows = this.quoteCart.map((item, index) => [
        index + 1,
        item.product.code || '---',
        item.product.name,
        '', 
        item.quantity,
        '', 
        item.product.price.toFixed(2),
        (item.product.price * item.quantity).toFixed(2)
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['#', 'Código', 'Producto', 'SC', 'Cant.', 'SC', 'P. Unit', 'Total']],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 7, halign: 'center', cellPadding: 1 },
        headStyles: { fillColor: [0, 168, 204], textColor: [255, 255, 255] },
        columnStyles: { 2: { halign: 'left', cellWidth: 60 } }
      });

      doc.save(`Cotizacion_${this.datosCliente.nombre || 'Cliente'}.pdf`);
    } catch (error) {
      this.mostrarMensaje('Error al generar PDF', 'danger');
    }
  }

  // FUNCIÓN AUXILIAR PARA GENERAR EXCEL
  private generarExcelArchivo() {
    const dataToExport = this.quoteCart.map(item => ({
      'CODIGO/SKU': item.product.code,
      'DESCRIPCION': item.product.name,
      'CANTIDAD': item.quantity,
      'PRECIO UNIT.': item.product.price, 
      'TOTAL PARCIAL': item.product.price * item.quantity 
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedido');
    
    const fecha = new Date().toLocaleDateString().replace(/\//g, '-');
    const nombreDoc = `Pedido_${this.datosCliente.nombre.replace(/\s+/g, '_') || 'Cliente'}_${fecha}.xlsx`;
    
    XLSX.writeFile(wb, nombreDoc);
  }

  async downloadExcel() {
    if (this.quoteCart.length === 0) return;
    this.generarExcelArchivo();
    this.mostrarMensaje('Excel descargado con éxito', 'success');
  }

async enviarWhatsApp() {
    if (this.quoteCart.length === 0) {
      this.mostrarMensaje('El carrito está vacío', 'warning');
      return;
    }

    if (!this.datosCliente.nombre) {
      this.mostrarMensaje('Ingresa el nombre del cliente', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Generando pedido...',
      duration: 2000
    });
    await loading.present();

    try {
      // 1. GENERAR EXCEL PRIMERO
      this.generarExcelArchivo();

      // 2. ACTUALIZAR STOCK
      for (const item of this.quoteCart) {
        const stockAnterior = item.product.stock;
        const nuevoStock = stockAnterior - item.quantity;
        await this.tiendaService.updateStock(item.product.id!, nuevoStock, item.product.name, stockAnterior);
      }

      // 3. CONSTRUIR MENSAJE
      let mensaje = `*NUEVO PEDIDO - TOTAL TOOLS PERÚ*\n\n`;
      mensaje += `👤 *Cliente:* ${this.datosCliente.nombre}\n`;
      mensaje += `------------------------------------------\n`;
      mensaje += `📂 _He adjuntado el archivo Excel del pedido_\n`;
      mensaje += `------------------------------------------\n`;
      this.quoteCart.forEach(item => {
        mensaje += `• ${item.quantity}x ${item.product.name}\n`;
      });
      mensaje += `\n💰 *TOTAL: S/ ${this.totalQuoteAmount.toFixed(2)}*`;

      // 4. EL TRUCO PARA MÓVILES: 
      // Usamos un pequeño delay (setTimeout) para que el navegador 
      // procese la descarga antes de intentar abrir WhatsApp.
      setTimeout(() => {
        const url = `whatsapp://send?phone=${this.phoneNumber}&text=${encodeURIComponent(mensaje)}`;
        
        // Intentamos abrir con esquema de App primero (whatsapp://) 
        // y si falla, usamos el enlace web (https://wa.me)
        window.location.href = url;

        // Limpieza después del envío
        this.quoteCart = []; 
        this.datosCliente = { nombre: '', documento: '' };
        this.calculateQuoteTotal();
        this.setOpen(false);
        loading.dismiss();
        this.mostrarMensaje('Excel descargado. Ahora adjúntalo en WhatsApp.', 'success');
      }, 800);

    } catch (error) {
      loading.dismiss();
      this.mostrarMensaje('Error al procesar el pedido', 'danger');
    }
  }

  async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 1500,
      color: color,
      position: 'top', 
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }
}