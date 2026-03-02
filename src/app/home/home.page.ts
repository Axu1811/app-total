import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { 
  IonContent, IonItem, IonInput, IonButton, IonIcon, 
  ToastController, LoadingController, AlertController // <--- Añadido AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, arrowForwardCircleOutline, arrowUndoOutline, mapOutline } from 'ionicons/icons'; // <--- Añadido mapOutline
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonItem, IonInput, IonButton, IonIcon],
})
export class HomePage {
  passwordType: string = 'password';
  passwordIcon: string = 'eye-outline';
  emailValue: string = '';
  passValue: string = '';

  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController); // <--- Inyectado AlertController

  constructor() {
    // Registrados todos los iconos, incluyendo el del mapa para el nuevo botón
    addIcons({ personCircleOutline, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline, arrowForwardCircleOutline, arrowUndoOutline, mapOutline });
  }

  // --- NUEVA FUNCIÓN PARA ACCESO CON PIN AL ALMACÉN ---
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
            if (data.pin === '1234') { 
              this.router.navigate(['/mapa-almacen']);
            } else {
              this.mostrarMensaje('PIN Incorrecto', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  togglePassword() {
    this.passwordType = this.passwordType === 'text' ? 'password' : 'text';
    this.passwordIcon = this.passwordIcon === 'eye-off-outline' ? 'eye-outline' : 'eye-off-outline';
  }

  async login() {
    if (!this.emailValue || !this.passValue) {
      this.mostrarMensaje('Ingresa tus credenciales', 'warning');
      return;
    }

    const loading = await this.loadingController.create({ message: 'Verificando...', spinner: 'crescent' });
    await loading.present();

    try {
      await this.authService.login(this.emailValue, this.passValue);
      loading.dismiss();
      this.mostrarMensaje('Acceso Autorizado', 'success');
      this.router.navigate(['/dashboard']);

    } catch (error: any) {
      loading.dismiss();
      this.mostrarMensaje('Acceso Denegado: Datos incorrectos', 'danger');
    }
  }

  async mostrarMensaje(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje, duration: 2000, color: color, position: 'bottom'
    });
    toast.present();
  }
}