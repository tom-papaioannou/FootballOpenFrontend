/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { authenticationGuard } from './guards/authentication.guard';
import { Team } from './components/team/team';
import { Squad } from './components/team/squad/squad';
import { Tactics } from './components/team/tactics/tactics';
import { TacticsDetail } from './components/team/tactics-detail/tactics-detail';
import { Fixtures } from './components/team/fixtures/fixtures';
import { Information } from './components/team/information/information';
import { Staff } from './components/team/staff/staff';
import { Servers } from './components/servers/servers';
import { ServerDetails } from './components/server-details/server-details';
import { guestsGuard } from './guards/guests-guard';
import { defaultLandingGuard } from './guards/default-landing.guard';

export const routes: Routes = [
    { path: '', pathMatch: 'full', canActivate: [defaultLandingGuard], component: Home },
    { path: 'home', canActivate: [authenticationGuard], component: Home },
    // { path: 'error', component: Home },
    { path: 'login', canActivate: [guestsGuard], component: Login },
    {
        path: 'register',
        canActivate: [guestsGuard],
        loadComponent: () => import('./components/register/register').then(m => m.Register)
    },
    { path: 'servers', canActivate: [authenticationGuard], component: Servers },
    { path: 'server/:id', canActivate: [authenticationGuard], component: ServerDetails },
    {
        path: 'adminpanel',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/admin-panel/admin-panel').then(m => m.AdminPanel)
    },
    {
        path: 'admin/register-host',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/admin-register-host/admin-register-host').then(m => m.AdminRegisterHost)
    },
    {
        path: 'competitions-management',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/competitions-management/competitions-management').then(m => m.CompetitionsManagement)
    },
    {
        path: 'competition/:id',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/competition-details/competition-details').then(m => m.CompetitionDetails)
    },
    {
        path: 'player/:id',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/team/player-details/player-details').then(m => m.PlayerDetails)
    },
    {
        path: 'manager-profile/:id',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/manager-profile/manager-profile').then(m => m.ManagerProfile)
    },
    {
        path: 'coach-profile/:id',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/coach-profile/coach-profile').then(m => m.CoachProfile)
    },
    {
        path: 'medic-profile/:id',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/medic-profile/medic-profile').then(m => m.MedicProfile)
    },
    {
        path: 'competitions',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/world-map/world-map').then(m => m.WorldMap)
    },
    {
        path: 'nations/:nationId/competitions',
        canActivate: [authenticationGuard],
        loadComponent: () => import('./components/nation-competitions/nation-competitions').then(m => m.NationCompetitions)
    },
    { path: 'team/tactics', canActivate: [authenticationGuard], component: Tactics },
    { path: 'team/tactics/:id', canActivate: [authenticationGuard], component: TacticsDetail },
    { path: 'team/information', canActivate: [authenticationGuard], component: Information },
    { path: 'team', canActivate: [authenticationGuard], component: Team,
        children: [
            { path: '', redirectTo: 'squad', pathMatch: 'full' },
            { path: 'squad', component: Squad },
            { path: 'fixtures', component: Fixtures },
            { path: 'staff', component: Staff },
            { path: ':teamID/squad', component: Squad },
            { path: ':teamID/fixtures', component: Fixtures },
            { path: ':teamID/staff', component: Staff }
        ]
    },
    { path: '**', redirectTo: '/home' },
];
