/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, startWith } from 'rxjs';

@Component({
  selector: 'app-team',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './team.html',
  styleUrl: './team.css'
})
export class Team {
  squadLink: string[] = ['/team', 'squad'];
  fixturesLink: string[] = ['/team', 'fixtures'];
  staffLink: string[] = ['/team', 'staff'];
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.updateTabLinks());
  }

  private updateTabLinks(): void {
    const teamID = this.route.firstChild?.snapshot.paramMap.get('teamID');

    this.squadLink = teamID ? ['/team', teamID, 'squad'] : ['/team', 'squad'];
    this.fixturesLink = teamID ? ['/team', teamID, 'fixtures'] : ['/team', 'fixtures'];
    this.staffLink = teamID ? ['/team', teamID, 'staff'] : ['/team', 'staff'];
  }
}
