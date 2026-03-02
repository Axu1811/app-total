import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonIcon, IonButton, IonButtons 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackOutline, addCircle, trash, create, timeOutline } from 'ionicons/icons';
import { TiendaService, StockLog } from '../services/tienda.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonIcon, IonButton, IonButtons]
})
export class HistoryPage implements OnInit { // <--- Verifica que se llame HistoryPage

  logs: StockLog[] = [];
  private tiendaService = inject(TiendaService);

  constructor() {
    addIcons({ arrowBackOutline, addCircle, trash, create, timeOutline });
  }

  ngOnInit() {
    this.tiendaService.getLogs().subscribe(data => {
      this.logs = data;
    });
  }
}