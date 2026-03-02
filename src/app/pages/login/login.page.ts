import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardContent, IonItem, 
  IonLabel, IonInput, IonButton, IonIcon, ToastController, IonNote,
  AlertController // <--- PASO 3: Importado AlertController
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { lockClosedOutline, mailOutline, mapOutline, logInOutline, hammerOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'], 
  standalone: true,
  imports: [IonNote, 
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, 
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonItem, IonLabel, IonInput, IonButton, IonIcon, RouterLink 
  ]
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController); // <--- PASO 3: Inyectado

  email: string = '';
  pass: string = '';

  constructor() {
    addIcons({ lockClosedOutline, mailOutline, mapOutline, logInOutline, hammerOutline });
  }

  async onLogin() {
    if (!this.email || !this.pass) {
      this.mostrarToast('Ingresa tus credenciales', 'warning');
      return;
    }

    try {
      await this.authService.login(this.email, this.pass);
      this.mostrarToast('¡Bienvenido, Administrador!', 'success');
      this.router.navigate(['/admin']); 
    } catch (error) {
      this.mostrarToast('Correo o contraseña incorrectos', 'danger');
    }
  }

  // --- PASO 2: Lógica de la Clave Rápida ---
  async accederAlMapa() {
    const alert = await this.alertController.create({
      header: 'Acceso Almacén',
      subHeader: 'Ingrese el PIN de seguridad',
      mode: 'ios',
      inputs: [
        {
          name: 'pin',
          type: 'password',
          placeholder: 'PIN de 4 dígitos',
          attributes: {
            maxlength: 4,
            inputmode: 'numeric'
          }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Ingresar',
          handler: (data) => {
            if (data.pin === '1234') { // <--- Aquí puedes cambiar tu clave
              this.router.navigate(['/mapa-almacen']);
            } else {
              this.mostrarToast('PIN Incorrecto', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async mostrarToast(msg: string, color: any) { 
    const toast = await this.toastController.create({
      message: msg, duration: 2000, color: color
    });
    toast.present();
  }

  irAlMapa() {
    this.router.navigate(['/mapa-almacen']);
  }
}