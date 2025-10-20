import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { authenticationGuard } from './guards/authentication.guard';

export const routes: Routes = [
    { path: 'home', canActivate: [authenticationGuard], component: Home },
    // { path: 'error', component: Home },
    { path: 'login', component: Login },
    { path: '**', redirectTo: '/home' },
];