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
  AlertController, LoadingController // Agregados para gestión de borrado
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
  close, trashBinOutline, cloudUploadOutline // Nuevos iconos para borrar y subir
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
  isAdmin: boolean = true; // Cambiar según tu lógica de sesión
  
  categories = ['Todo', 'Taladros', 'Sierras', 'Amoladoras', 'Kits', 'Accesorios'];
  selectedCategory = 'Todo';
  quoteCart: QuoteItem[] = [];
  isModalOpen = false;
  phoneNumber = '51912816093'; 

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
  // --- EXPORTACIÓN Y VENTA ---

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
      doc.text(`nombre del cliente: ${this.datosCliente.nombre || '---'}`, 14, 35);
      doc.text(`Número de pedido de venta: QT-${Math.floor(Math.random() * 1000000)}`, 120, 35);
      doc.text(`Teléfono del cliente: ---`, 14, 42); 
      doc.text(`Fecha de pedido: ${fechaActual}`, 120, 42);
      doc.text(`Observación:`, 14, 49);

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
        head: [['#', 'Número de Articulo', 'nombre del producto', 'SC', 'Cantidad', 'SC', 'Precio por unidad', 'Total Parcial']],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 7, halign: 'center', cellPadding: 1 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1 },
        columnStyles: {
          2: { halign: 'left', cellWidth: 60 }
        }
      });

      let finalY = (doc as any).lastAutoTable.finalY + 10;

      doc.setFontSize(8);
      doc.text('(PT)LESS:', 14, finalY);
      doc.text(`Peso (kg): ---  Volumen (M³): ---`, 14, finalY + 5);

      const rightColX = 140;
      doc.text(`Cantidad total de ventas: ${this.totalQuoteAmount.toFixed(2)}`, rightColX, finalY);
      doc.text(`Monto de la deducción: 0.00`, rightColX, finalY + 5);
      doc.text(`Monto con descuento: ${this.totalQuoteAmount.toFixed(2)}`, rightColX, finalY + 10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Importe (impuestos incluidos): ${this.totalQuoteAmount.toFixed(2)}`, rightColX, finalY + 15);

      finalY += 30;
      doc.rect(14, finalY, 30, 15);
      doc.text('Creador', 16, finalY + 5);
      doc.text('Gonzalo Ticona', 16, finalY + 12); 

      doc.text('CHECKER: _________________________', 14, finalY + 25);

      doc.save(`Cotizacion_${this.datosCliente.nombre || 'Cliente'}.pdf`);
    } catch (error) {
      console.error(error);
      this.mostrarMensaje('Error al generar el formato PDF', 'danger');
    }
  }

  async downloadExcel() {
    if (this.quoteCart.length === 0) return;

    const dataToExport = this.quoteCart.map(item => ({
      'SKU': item.product.code,
      'HERRAMIENTA': item.product.name,
      'CANTIDAD': item.quantity,
      'PRECIO UNIT.': item.product.price, 
      'TOTAL': item.product.price * item.quantity 
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedido');
    XLSX.writeFile(wb, `Pedido_TotalTools_${new Date().getTime()}.xlsx`);
    this.mostrarMensaje('Excel descargado con éxito', 'success');
  }

  async enviarWhatsApp() {
    if (this.quoteCart.length === 0) {
      this.mostrarMensaje('El carrito está vacío', 'warning');
      return;
    }

    try {
      for (const item of this.quoteCart) {
        const stockAnterior = item.product.stock;
        const nuevoStock = stockAnterior - item.quantity;
        await this.tiendaService.updateStock(item.product.id!, nuevoStock, item.product.name, stockAnterior);
      }

      let mensaje = `*NUEVO PEDIDO - TOTAL TOOLS PERÚ*\n\n`;
      mensaje += `👤 *Cliente:* ${this.datosCliente.nombre || 'No indicado'}\n`;
      mensaje += `🆔 *DNI/RUC:* ${this.datosCliente.documento || 'No indicado'}\n`;
      mensaje += `------------------------------------------\n`;
      
      this.quoteCart.forEach(item => {
        mensaje += `• ${item.quantity}x ${item.product.name} [${item.product.code}]\n`;
      });

      mensaje += `------------------------------------------\n`;
      mensaje += `💰 *TOTAL A PAGAR: S/ ${this.totalQuoteAmount.toFixed(2)}*\n\n`;
      mensaje += `🚀 _Enviado desde el Catálogo Digital_`;

      const url = `https://wa.me/${this.phoneNumber}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
      
      this.quoteCart = []; 
      this.datosCliente = { nombre: '', documento: '' };
      this.calculateQuoteTotal();
      this.setOpen(false);
      this.mostrarMensaje('Pedido enviado y stock actualizado', 'success');

    } catch (error) {
      this.mostrarMensaje('Error al procesar el envío', 'danger');
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