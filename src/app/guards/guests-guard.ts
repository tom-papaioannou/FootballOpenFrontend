/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, tap } from 'rxjs';

export const guestsGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isLoggedIn()) {
    return authService.getDefaultAuthenticatedRoute$().pipe(
      tap((route) => router.navigate([route])),
      map(() => false)
    );
  }

  authService.emitChange();
  return true;
};
