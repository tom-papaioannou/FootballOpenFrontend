import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { authenticationGuard } from './guards/authentication.guard';
import { Tournaments } from './components/tournaments/tournaments';

export const routes: Routes = [
    { path: 'home', canActivate: [authenticationGuard], component: Home },
    // { path: 'error', component: Home },
    { path: 'login', component: Login },
    { path: 'tournaments', component: Tournaments },
    { path: '**', redirectTo: '/home' },
];