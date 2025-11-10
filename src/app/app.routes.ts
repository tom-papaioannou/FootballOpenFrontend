import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { authenticationGuard } from './guards/authentication.guard';
import { Tournaments } from './components/tournaments/tournaments';
import { Team } from './components/team/team';
import { Squad } from './components/team/squad/squad';
import { Tactics } from './components/team/tactics/tactics';
import { Fixtures } from './components/team/fixtures/fixtures';

export const routes: Routes = [
    { path: 'home', canActivate: [authenticationGuard], component: Home },
    // { path: 'error', component: Home },
    { path: 'login', component: Login },
    { path: 'tournaments', component: Tournaments },
    { path: 'team', component: Team,
        children:[
            { path: '', redirectTo: 'squad', pathMatch: "prefix" },
            { path: 'squad', component: Squad },
            { path: 'tactics', component: Tactics },
            { path: 'fixtures', component: Fixtures }
        ]
    },
    { path: '**', redirectTo: '/home' },
];