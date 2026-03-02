import { inject, Injectable } from '@angular/core';
// Importaciones modulares de AngularFire
import { 
  Auth, 
  signInWithEmailAndPassword, 
  signOut, 
  authState, 
  user,
  User
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Inyectamos el servicio Auth de Firebase
  private auth = inject(Auth);

  // Observables para que la app sepa si estás logueado (RF6)
  user$: Observable<User | null> = user(this.auth); 
  authState$ = authState(this.auth);

  constructor() {}

  // Función para iniciar sesión (RF6)
  async login(email: string, pass: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, pass);
      return userCredential.user;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  }

  // Función para cerrar sesión
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error("Error al salir:", error);
    }
  }

  // Obtener el ID del usuario actual de forma segura
  get currentUserId(): string | null {
    const user = this.auth.currentUser; // Extraemos el objeto primero
    return user ? user.uid : null;      // Si existe el usuario, retornamos su ID
  }
}