/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { routes } from './app.routes';
import { authenticationGuard } from './guards/authentication.guard';
import { guestsGuard } from './guards/guests-guard';
import { defaultLandingGuard } from './guards/default-landing.guard';

describe('App Routes', () => {
  it('should have authenticationGuard on home route', () => {
    const homeRoute = routes.find(r => r.path === 'home');
    expect(homeRoute?.canActivate).toContain(authenticationGuard);
  });

  it('should send the empty route through default landing selection', () => {
    const route = routes.find(r => r.path === '');
    expect(route?.canActivate).toContain(defaultLandingGuard);
  });

  it('should have authenticationGuard on adminpanel route', () => {
    const route = routes.find(r => r.path === 'adminpanel');
    expect(route?.canActivate).toContain(authenticationGuard);
  });

  it('should have authenticationGuard on admin host registration route', () => {
    const route = routes.find(r => r.path === 'admin/register-host');
    expect(route?.canActivate).toContain(authenticationGuard);
  });

  it('should have guestsGuard on login route', () => {
    const loginRoute = routes.find(r => r.path === 'login');
    expect(loginRoute?.canActivate).toContain(guestsGuard);
  });

  it('should have guestsGuard on register route', () => {
    const registerRoute = routes.find(r => r.path === 'register');
    expect(registerRoute?.canActivate).toContain(guestsGuard);
  });

  it('should have authenticationGuard on competitions-management route', () => {
    const route = routes.find(r => r.path === 'competitions-management');
    expect(route?.canActivate).toContain(authenticationGuard);
  });

  it('should have authenticationGuard on competition/:id route', () => {
    const route = routes.find(r => r.path === 'competition/:id');
    expect(route?.canActivate).toContain(authenticationGuard);
  });

  it('should have authenticationGuard on player/:id route', () => {
    const route = routes.find(r => r.path === 'player/:id');
    expect(route?.canActivate).toContain(authenticationGuard);
  });

  it('should have authenticationGuard on competitions route', () => {
    const route = routes.find(r => r.path === 'competitions');
    expect(route?.canActivate).toContain(authenticationGuard);
  });

  it('should have authenticationGuard on team route', () => {
    const teamRoute = routes.find(r => r.path === 'team');
    expect(teamRoute?.canActivate).toContain(authenticationGuard);
  });

  it('should include squad, fixtures, and staff child routes under team', () => {
    const teamRoute = routes.find(r => r.path === 'team');
    const squadRoute = teamRoute?.children?.find(c => c.path === 'squad');
    const fixturesRoute = teamRoute?.children?.find(c => c.path === 'fixtures');
    const staffRoute = teamRoute?.children?.find(c => c.path === 'staff');

    expect(squadRoute).toBeTruthy();
    expect(fixturesRoute).toBeTruthy();
    expect(staffRoute).toBeTruthy();
  });

  it('should keep information outside the team tab route', () => {
    const informationRoute = routes.find(r => r.path === 'team/information');
    expect(informationRoute).toBeTruthy();
  });

  it('should not include player or tactics as team tab child routes', () => {
    const teamRoute = routes.find(r => r.path === 'team');
    const playerRoute = teamRoute?.children?.find(c => c.path === 'player/:id');
    const tacticsRoute = teamRoute?.children?.find(c => c.path === 'tactics');

    expect(playerRoute).toBeUndefined();
    expect(tacticsRoute).toBeUndefined();
  });

  it('should have authenticationGuard on component routes except login and default landing', () => {
    const routesWithComponents = routes.filter(r => 
      r.component !== undefined && 
      r.path !== '' &&
      r.path !== 'login' &&
      r.path !== 'register'
    );
    
    // All routed screens except login/register use authenticated access.
    routesWithComponents.forEach(route => {
      expect(route.canActivate).toContain(authenticationGuard);
    });
    
    // Verify we're checking the expected number of protected routes
    expect(routesWithComponents.length).toBeGreaterThan(0);
  });
});
