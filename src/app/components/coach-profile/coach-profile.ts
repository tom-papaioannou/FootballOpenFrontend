/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { Card } from '../shared/cards/card/card';
import { DataTable } from '../shared/tables/data-table/data-table';
import { TeamsService } from '../../services/teams.service';
import { NationService } from '../../services/nation.service';
import { calculateAge } from '../../utils/date-utils';
import { getNationFlagUrl } from '../../utils/nation-map-utils';
import { INation } from '../../models/nation.model';

interface CoachStats {
  attack: number;
  defend: number;
  control: number;
  goalkeeper: number;
  tactic: number;
  fitness: number;
}

interface CoachDetailsResponse {
  name: string;
  surname: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationID?: string | null;
  weight: number;
  height: number;
  coachStats: CoachStats | null;
  contracts: Array<{
    startDate: string;
    endDate?: string | null;
    wage: number;
    team: { name: string };
  }>;
}

interface ContractHistoryRow {
  team: string;
  period: string;
}

interface CoachStatRow {
  name: string;
  value: number;
}

@Component({
  selector: 'app-coach-profile',
  imports: [CommonModule, MatButtonModule, MatIconModule, Card, DataTable],
  templateUrl: './coach-profile.html',
  styleUrl: './coach-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoachProfile implements OnInit, OnDestroy {
  coachDetails: CoachDetailsResponse | null = null;
  coachName = '';
  dateOfBirth = '';
  age: number | null = null;
  placeOfBirth = '';
  weight: number | null = null;
  height: number | null = null;
  nationalityName = '';
  nationalityFlagUrl = '';
  currentTeam = '-';
  currentContractExpiry = '';
  currentWage: number | null = null;
  loading = true;
  error: string | null = null;

  readonly contractsColumns = [
    { key: 'team', header: 'Team', width: '60%' },
    { key: 'period', header: 'Period', width: '40%' }
  ];
  contractHistory: ContractHistoryRow[] = [];
  coachStats: CoachStatRow[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly teamsService: TeamsService,
    private readonly nationService: NationService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const coachID = this.route.snapshot.paramMap.get('id');
    if (!coachID) {
      this.error = 'No coach ID provided';
      this.loading = false;
      return;
    }

    this.loadCoachDetails(coachID);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/team/staff']);
  }

  getStatValueClass(value: number): string {
    if (value <= 50) {
      return 'text-gray-300';
    }

    if (value <= 75) {
      return 'text-green-500';
    }

    return 'text-green-400';
  }

  private loadCoachDetails(coachID: string): void {
    forkJoin({
      coach: this.teamsService.getCoachDetails(coachID),
      nations: this.nationService.getAll()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ coach, nations }: { coach: CoachDetailsResponse; nations: INation[] }) => {
          this.coachDetails = coach;
          this.coachName = `${coach.name ?? ''} ${coach.surname ?? ''}`.trim();
          this.dateOfBirth = this.formatDate(coach.dateOfBirth);
          this.age = calculateAge(coach.dateOfBirth);
          this.placeOfBirth = coach.placeOfBirth ?? '';
          this.weight = coach.weight;
          this.height = coach.height;

          const nation = coach.nationID ? nations.find(item => item.nationID === coach.nationID) : undefined;
          this.nationalityName = nation?.name ?? '';
          this.nationalityFlagUrl = nation ? getNationFlagUrl(nation) : '';
          this.transformContracts();
          this.transformCoachStats();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Error loading coach profile:', error);
          this.error = 'Failed to load coach profile';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private transformContracts(): void {
    if (!this.coachDetails?.contracts) {
      this.contractHistory = [];
      return;
    }

    const activeContract = this.coachDetails.contracts.find(
      contract => !contract.endDate || new Date(contract.endDate) > new Date()
    );

    if (activeContract) {
      this.currentTeam = activeContract.team?.name ?? '-';
      this.currentContractExpiry = this.formatDate(activeContract.endDate);
      this.currentWage = activeContract.wage;
    }

    this.contractHistory = this.coachDetails.contracts.map(contract => ({
      team: contract.team?.name ?? 'Unknown',
      period: this.formatContractPeriod(contract.startDate, contract.endDate)
    }));
  }

  private transformCoachStats(): void {
    const stats = this.coachDetails?.coachStats;
    this.coachStats = stats
      ? [
          { name: 'Attack', value: stats.attack },
          { name: 'Defend', value: stats.defend },
          { name: 'Control', value: stats.control },
          { name: 'Goalkeeper', value: stats.goalkeeper },
          { name: 'Tactic', value: stats.tactic },
          { name: 'Fitness', value: stats.fitness }
        ]
      : [];
  }

  private formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getUTCFullYear()}`;
  }

  private formatContractPeriod(startDateString: string, endDateString?: string | null): string {
    if (!startDateString) {
      return '-';
    }

    const startDate = new Date(startDateString);
    if (isNaN(startDate.getTime())) {
      return '-';
    }

    if (!endDateString) {
      return `${startDate.getUTCFullYear()} -`;
    }

    const endDate = new Date(endDateString);
    if (isNaN(endDate.getTime())) {
      return '-';
    }

    const now = new Date();
    const endDateOnly = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
    const nowDateOnly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (endDateOnly > nowDateOnly) {
      return `${startDate.getUTCFullYear()} -`;
    }

    return startDate.getUTCFullYear() === endDate.getUTCFullYear()
      ? `${startDate.getUTCFullYear()}`
      : `${startDate.getUTCFullYear()} - ${endDate.getUTCFullYear()}`;
  }
}
