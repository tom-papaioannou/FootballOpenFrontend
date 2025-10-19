import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'auth', component: Home },
    { path: 'error', component: Home },
    { path: 'login', component: Login },
    //   { path: '', canActivate: [AuthGuard], loadChildren: () => import('./_metronic/layout/layout.module').then((m) => m.LayoutModule) },
    { path: '**', redirectTo: '/' },
];