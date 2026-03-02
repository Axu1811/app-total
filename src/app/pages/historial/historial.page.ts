import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, 
  IonItem, IonLabel, IonBadge, IonIcon, IonButtons, IonButton 
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TiendaService, StockLog } from '../../services/tienda.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline, timeOutline, cubeOutline, alertCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterLink, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonList, IonItem, IonLabel, IonBadge, IonIcon, 
    IonButtons, IonButton
  ]
})
export class HistorialPage implements OnInit {
  logs: StockLog[] = [];
  private tiendaService = inject(TiendaService);

  constructor() {
    addIcons({ arrowBackOutline, timeOutline, cubeOutline, alertCircleOutline });
  }

  ngOnInit() {
    // Escuchamos los cambios en la colección 'history' de Firebase
    this.tiendaService.getLogs().subscribe(data => {
      this.logs = data;
    });
  }

  getBadgeColor(detail: string): string {
    if (detail.includes('ENTRADA')) return 'success';
    if (detail.includes('SALIDA')) return 'danger';
    return 'medium';
  }
}