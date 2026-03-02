import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TiendaService } from '../services/tienda.service';
import { map, take } from 'rxjs/operators';

export const roleGuard: CanActivateFn = (route, state) => {
  const tiendaService = inject(TiendaService);
  const router = inject(Router);
  
  // Obtenemos el rol esperado desde la configuración de la ruta
  const expectedRole = route.data['role'];

  return tiendaService.getUserRole().pipe(
    take(1),
    map(role => {
      // Si el usuario es admin o tiene el rol específico, permitimos el paso
      if (role === 'admin' || role === expectedRole) {
        return true;
      }

      // Si no tiene permiso, lo mandamos al dashboard
      console.warn('Acceso denegado: No tienes el rol necesario');
      router.navigate(['/dashboard']);
      return false;
    })
  );
};