import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path: 'welcome',
    loadComponent: () => import('./welcome/welcome.page').then(m => m.WelcomePage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage),
    // ELIMINADO: canActivate para que el catálogo cargue directo en el celular
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./catalogo/catalogo.page').then(m => m.CatalogoPage),
    // ELIMINADO: canActivate para acceso libre al stock
  },
  {
    path: 'history',
    loadComponent: () => import('./history/history.page').then(m => m.HistoryPage),
    canActivate: [authGuard] // Mantenemos protegido el historial de cambios
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
    canActivate: [authGuard] 
  },
  {
    path: 'historial',
    loadComponent: () => import('./pages/historial/historial.page').then(m => m.HistorialPage),
    canActivate: [authGuard] 
  },
  {
    path: '',
    redirectTo: 'dashboard', // CAMBIADO: Ahora la app abre directo en el inventario
    pathMatch: 'full',
  },
  {
    path: 'mapa-almacen',
    loadComponent: () => import('./pages/mapa-almacen/mapa.page').then( m => m.MapaPage)
  },
];