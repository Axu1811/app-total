import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { gridOutline, locationOutline, cubeOutline, arrowBackOutline, searchOutline, barcodeOutline, mapOutline } from 'ionicons/icons';
// Asegúrate de que esta ruta sea la correcta hacia tu servicio
import { TiendaService, Product } from '../../services/tienda.service'; 
import { RouterLink } from '@angular/router';

interface EstanteMapa {
  nombre: string;
  color: string;
  productos: Product[];
}

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class MapaPage implements OnInit {
  private tiendaService = inject(TiendaService);

  // --- VARIABLES DE DATOS ---
  fullInventory: Product[] = [];
  estantes: EstanteMapa[] = [];
  searchTerm: string = ''; // Variable para el buscador
  letrasEstantes: string[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

  constructor() {
    addIcons({ 
      gridOutline, 
      locationOutline, 
      cubeOutline, 
      arrowBackOutline, 
      searchOutline, 
      barcodeOutline, 
      mapOutline 
    });
  }

  ngOnInit() {
    this.tiendaService.getProducts().subscribe(data => {
      this.fullInventory = data || [];
      this.generarMapa();
    });
  }

  // --- LÓGICA DE FILTRADO Y GENERACIÓN ---
  generarMapa() {
    const query = this.searchTerm.toLowerCase().trim();

    this.estantes = this.letrasEstantes.map(letra => {
      // Filtramos productos por estante y por término de búsqueda
      const productosFiltrados = this.fullInventory.filter(p => {
        const enEsteEstante = p.estante?.toUpperCase() === letra;
        const coincideBusqueda = p.name.toLowerCase().includes(query) || 
                                p.code.toLowerCase().includes(query);
        return enEsteEstante && coincideBusqueda;
      });

      return {
        nombre: letra,
        color: this.obtenerColorEstante(letra),
        productos: productosFiltrados
      };
    }).filter(estante => {
      // Si el usuario está buscando, ocultamos los estantes vacíos
      // Si no hay búsqueda, mostramos todos los estantes
      return query === '' ? true : estante.productos.length > 0;
    });
  }

  // Función que se dispara desde el HTML al escribir
  filterItems() {
    this.generarMapa();
  }

  obtenerColorEstante(letra: string): string {
    if (['A', 'B', 'C', 'D'].includes(letra)) return '#00a8cc';
    if (['E', 'F', 'G', 'H'].includes(letra)) return '#28a745';
    return '#fd7e14';
  }
}