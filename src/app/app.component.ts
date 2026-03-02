import { Component, inject } from '@angular/core'; 
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  // IMPORTANTE: IonApp y IonRouterOutlet son obligatorios aquí
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  public authService = inject(AuthService); // Hacemos inyect del servicio
  private router = inject(Router);

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/welcome']); // Al salir, te manda al inicio
  }
}