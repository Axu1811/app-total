import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { mapOutline, gridOutline, searchOutline, barcodeOutline, cubeOutline, arrowBackOutline } from 'ionicons/icons';
import { TiendaService, Product } from '../../services/tienda.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mapa',
templateUrl: './mapa.page.html',
styleUrls: ['./mapa.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule, RouterLink]
})
export class MapaPage implements OnInit {
  private tiendaService = inject(TiendaService);
  
  fullInventory: Product[] = [];
  filteredInventory: Product[] = [];
  searchTerm: string = '';
  estantes: string[] = ['A', 'B', 'C', 'D', 'E']; // Define tus estantes aquí

  constructor() {
    addIcons({ mapOutline, gridOutline, searchOutline, barcodeOutline, cubeOutline, arrowBackOutline });
  }

  ngOnInit() {
    this.tiendaService.getProducts().subscribe(data => {
      this.fullInventory = data;
      this.filterItems();
    });
  }

  filterItems() {
    const query = this.searchTerm.toLowerCase();
    this.filteredInventory = this.fullInventory.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.code && p.code.toLowerCase().includes(query))
    );
  }

  getProductsByShelf(shelf: string) {
    return this.filteredInventory.filter(p => p.estante === shelf);
  }
}