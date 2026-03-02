import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router'; // 1. IMPORTAR AQUÍ
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { hammer, storefrontOutline, arrowForwardOutline, personCircleOutline, arrowForwardCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  // 2. AÑADIR A LA LISTA DE IMPORTS
  imports: [IonContent, CommonModule, FormsModule, IonButton, IonIcon, RouterLink] 
})
export class WelcomePage implements OnInit {

  constructor() {
    addIcons({hammer,storefrontOutline,arrowForwardCircleOutline,personCircleOutline,arrowForwardOutline});
  }

  ngOnInit() {
  }

}