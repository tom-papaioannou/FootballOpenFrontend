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
import { Formation } from '../../models/tactic.model';
import { PlayerPosition } from '../../models/player-enums.model';
import { getPositionPitchRow } from '../../utils/position-utils';

interface ManagerDetailsResponse {
  name: string;
  surname: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationID?: string | null;
  weight: number;
  height: number;
  contracts: Array<{
    startDate: string;
    endDate?: string | null;
    wage: number;
    team: {
      name: string;
    };
  }>;
}

interface ManagerGameStats {
  wins: number;
  draws: number;
  losses: number;
  gamesPlayed: number;
  leaguesWon: number;
  cupsWon: number;
}

interface ManagerProfileSummaryResponse {
  gameStats?: ManagerGameStats | null;
  favoriteFormation?: {
    formation: Formation;
    formationName: string;
    timesPicked: number;
  } | null;
}

interface TransformedContract {
  team: string;
  period: string;
}

interface FormationPreviewRow {
  rowIndex: number;
  positions: PlayerPosition[];
}

@Component({
  selector: 'app-manager-profile',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    Card,
    DataTable
  ],
  templateUrl: './manager-profile.html',
  styleUrl: './manager-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagerProfile implements OnInit, OnDestroy {
  managerDetails: ManagerDetailsResponse | null = null;
  managerName = '';
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

  contractsColumns = [
    { key: 'team', header: 'Team', width: '60%' },
    { key: 'period', header: 'Period', width: '40%' }
  ];

  transformedContracts: TransformedContract[] = [];
  gameStats: ManagerGameStats = this.getEmptyGameStats();
  favoriteFormation: Formation | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly teamsService: TeamsService,
    private readonly nationService: NationService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const managerID = this.route.snapshot.paramMap.get('id');
    if (managerID) {
      this.loadManagerDetails(managerID);
    } else {
      this.error = 'No manager ID provided';
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  getFormationPreviewRows(formation: Formation | null = this.favoriteFormation): FormationPreviewRow[] {
    if (formation === null) {
      return [];
    }

    const positions = this.getFormationPositions(formation);
    const rowMap = new Map<number, PlayerPosition[]>();

    for (const position of positions) {
      const row = getPositionPitchRow(position);
      if (row < 0) {
        continue;
      }

      if (!rowMap.has(row)) {
        rowMap.set(row, []);
      }

      rowMap.get(row)!.push(position);
    }

    return Array.from(rowMap.entries())
      .map(([rowIndex, rowPositions]) => ({
        rowIndex,
        positions: rowPositions.sort((a, b) => b - a)
      }))
      .sort((a, b) => b.rowIndex - a.rowIndex);
  }

  getPreviewRowClass(row: FormationPreviewRow): string {
    return row.positions.length <= 2 ? 'formation-preview-row centered' : 'formation-preview-row spaced';
  }

  getFormationLabel(formation: Formation | null = this.favoriteFormation): string {
    switch (formation) {
      case Formation.Four_Three_Three:
        return '4-3-3';
      case Formation.Three_Five_Two:
        return '3-5-2';
      case Formation.Five_Three_Two:
        return '5-3-2';
      case Formation.Four_Five_One:
        return '4-5-1';
      case Formation.Four_Two_Three_One:
        return '4-2-3-1';
      case Formation.Four_Three_Two_One:
        return '4-3-2-1';
      case Formation.Four_One_Four_One:
        return '4-1-4-1';
      case Formation.Four_Four_One_One:
        return '4-4-1-1';
      case Formation.Four_Two_Two_Two:
        return '4-2-2-2';
      case Formation.Four_Four_Two_Diamond:
        return '4-4-2-Diamond';
      case Formation.Four_Three_One_Two:
        return '4-3-1-2';
      case Formation.Four_One_Three_Two:
        return '4-1-3-2';
      case Formation.Four_One_Two_One_Two:
        return '4-1-2-1-2';
      case Formation.Three_Four_Three:
        return '3-4-3';
      case Formation.Three_Four_Two_One:
        return '3-4-2-1';
      case Formation.Three_Four_One_Two:
        return '3-4-1-2';
      case Formation.Three_Three_Four:
        return '3-3-4';
      case Formation.Three_Six_One:
        return '3-6-1';
      case Formation.Three_Three_Two_Two:
        return '3-3-2-2';
      case Formation.Three_Two_Three_Two:
        return '3-2-3-2';
      case Formation.Five_Four_One:
        return '5-4-1';
      case Formation.Five_Two_Three:
        return '5-2-3';
      case Formation.Five_Three_One_One:
        return '5-3-1-1';
      case Formation.Four_Six_Zero:
        return '4-6-0';
      case Formation.Two_Three_Five:
        return '2-3-5';
      case Formation.Four_Four_Two:
      default:
        return '4-4-2';
    }
  }

  getHomeShirtColor(): string {
    return this.teamsService.CurrentTeam?.kit?.homeShirtColor || 'rgb(207, 73, 73)';
  }

  getHomeShortsColor(): string {
    return this.teamsService.CurrentTeam?.kit?.homeShortsColor || 'rgba(0, 0, 0, 0.6)';
  }

  private loadManagerDetails(managerID: string): void {
    this.loading = true;
    forkJoin({
      manager: this.teamsService.getManagerDetails(managerID),
      summary: this.teamsService.getManagerProfileSummary(managerID),
      nations: this.nationService.getAll()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ manager, summary, nations }: { manager: ManagerDetailsResponse; summary: ManagerProfileSummaryResponse; nations: INation[] }) => {
          this.managerDetails = manager;
          this.managerName = `${manager.name || ''} ${manager.surname || ''}`.trim();
          this.dateOfBirth = this.formatDateOfBirth(manager.dateOfBirth);
          this.age = calculateAge(manager.dateOfBirth);
          this.placeOfBirth = manager.placeOfBirth || '';
          this.weight = manager.weight;
          this.height = manager.height;
          const nation = manager.nationID ? nations.find(item => item.nationID === manager.nationID) : undefined;
          this.nationalityName = nation?.name ?? '';
          this.nationalityFlagUrl = nation ? getNationFlagUrl(nation) : '';
          this.gameStats = summary.gameStats ?? this.getEmptyGameStats();
          const favoriteFormation = summary.favoriteFormation;
          this.favoriteFormation = favoriteFormation && favoriteFormation.timesPicked > 0
            ? Number(favoriteFormation.formation) as Formation
            : null;
          this.transformContracts();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Failed to load manager profile';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private getEmptyGameStats(): ManagerGameStats {
    return {
      wins: 0,
      draws: 0,
      losses: 0,
      gamesPlayed: 0,
      leaguesWon: 0,
      cupsWon: 0
    };
  }

  private transformContracts(): void {
    if (!this.managerDetails?.contracts) {
      this.transformedContracts = [];
      return;
    }

    const activeContract = this.managerDetails.contracts.find(
      contract => !contract.endDate || new Date(contract.endDate) > new Date()
    );

    if (activeContract) {
      this.currentTeam = activeContract.team?.name || '-';
      this.currentContractExpiry = this.formatDateOfBirth(activeContract.endDate ?? undefined);
      this.currentWage = activeContract.wage;
    }

    this.transformedContracts = this.managerDetails.contracts.map(contract => ({
      team: contract.team?.name || 'Unknown',
      period: this.formatContractPeriod(contract.startDate, contract.endDate)
    }));
  }

  private formatDateOfBirth(dateString: string | undefined): string {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${day}/${month}/${year}`;
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
    const now = new Date();

    if (isNaN(endDate.getTime())) {
      return '-';
    }

    const startYear = startDate.getUTCFullYear();
    const endYear = endDate.getUTCFullYear();
    const endDateOnly = new Date(Date.UTC(endYear, endDate.getUTCMonth(), endDate.getUTCDate()));
    const nowDateOnly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (endDateOnly > nowDateOnly) {
      return `${startYear} -`;
    }

    return startYear === endYear ? `${startYear}` : `${startYear} - ${endYear}`;
  }

  private getFormationPositions(formation: Formation): PlayerPosition[] {
    switch (formation) {
      case Formation.Four_Three_Three:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.CentralCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.CentralStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Three_Five_Two:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.RightMidfielder,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.CentralCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Five_Three_Two:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.CentralCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Four_Five_One:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightMidfielder,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.CentralCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftMidfielder,
          PlayerPosition.CentralStriker
        ];
      case Formation.Four_Two_Three_One:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightDefensiveMidfielder,
          PlayerPosition.LeftDefensiveMidfielder,
          PlayerPosition.RightAttackingMidfielder,
          PlayerPosition.CentralAttackingMidfielder,
          PlayerPosition.LeftAttackingMidfielder,
          PlayerPosition.CentralStriker
        ];
      case Formation.Four_Three_Two_One:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.CentralCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.RightAttackingMidfielder,
          PlayerPosition.LeftAttackingMidfielder,
          PlayerPosition.CentralStriker
        ];
      case Formation.Four_One_Four_One:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.CentralDefensiveMidfielder,
          PlayerPosition.RightMidfielder,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftMidfielder,
          PlayerPosition.CentralStriker
        ];
      case Formation.Four_Four_One_One:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightMidfielder,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftMidfielder,
          PlayerPosition.CentralAttackingMidfielder,
          PlayerPosition.CentralStriker
        ];
      case Formation.Four_Two_Two_Two:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightDefensiveMidfielder,
          PlayerPosition.LeftDefensiveMidfielder,
          PlayerPosition.RightAttackingMidfielder,
          PlayerPosition.LeftAttackingMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Four_Four_Two_Diamond:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.CentralDefensiveMidfielder,
          PlayerPosition.RightMidfielder,
          PlayerPosition.LeftMidfielder,
          PlayerPosition.CentralAttackingMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Four_Three_One_Two:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.CentralCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.CentralAttackingMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Four_One_Three_Two:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.CentralDefensiveMidfielder,
          PlayerPosition.RightMidfielder,
          PlayerPosition.CentralCenterMidfielder,
          PlayerPosition.LeftMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Four_One_Two_One_Two:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.CentralDefensiveMidfielder,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.CentralAttackingMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Three_Four_Three:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.RightWingBack,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftWingBack,
          PlayerPosition.RightWinger,
          PlayerPosition.CentralStriker,
          PlayerPosition.LeftWinger
        ];
      case Formation.Three_Four_Two_One:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.RightWingBack,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftWingBack,
          PlayerPosition.RightAttackingMidfielder,
          PlayerPosition.LeftAttackingMidfielder,
          PlayerPosition.CentralStriker
        ];
      case Formation.Three_Four_One_Two:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.RightWingBack,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftWingBack,
          PlayerPosition.CentralAttackingMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Three_Three_Four:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.RightDefensiveMidfielder,
          PlayerPosition.CentralDefensiveMidfielder,
          PlayerPosition.LeftDefensiveMidfielder,
          PlayerPosition.RightWinger,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker,
          PlayerPosition.LeftWinger
        ];
      case Formation.Three_Six_One:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.RightMidfielder,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.CentralCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftMidfielder,
          PlayerPosition.CentralAttackingMidfielder,
          PlayerPosition.CentralStriker
        ];
      case Formation.Three_Three_Two_Two:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.RightDefensiveMidfielder,
          PlayerPosition.CentralDefensiveMidfielder,
          PlayerPosition.LeftDefensiveMidfielder,
          PlayerPosition.RightAttackingMidfielder,
          PlayerPosition.LeftAttackingMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Three_Two_Three_Two:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.RightDefensiveMidfielder,
          PlayerPosition.LeftDefensiveMidfielder,
          PlayerPosition.RightAttackingMidfielder,
          PlayerPosition.CentralAttackingMidfielder,
          PlayerPosition.LeftAttackingMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
      case Formation.Five_Four_One:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightMidfielder,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftMidfielder,
          PlayerPosition.CentralStriker
        ];
      case Formation.Five_Two_Three:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightWingBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftWingBack,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.RightWinger,
          PlayerPosition.CentralStriker,
          PlayerPosition.LeftWinger
        ];
      case Formation.Five_Three_One_One:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightWingBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.CentralCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftWingBack,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.CentralCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.CentralAttackingMidfielder,
          PlayerPosition.CentralStriker
        ];
      case Formation.Four_Six_Zero:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightDefensiveMidfielder,
          PlayerPosition.LeftDefensiveMidfielder,
          PlayerPosition.RightWinger,
          PlayerPosition.RightAttackingMidfielder,
          PlayerPosition.LeftAttackingMidfielder,
          PlayerPosition.LeftWinger
        ];
      case Formation.Two_Three_Five:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.RightDefensiveMidfielder,
          PlayerPosition.CentralDefensiveMidfielder,
          PlayerPosition.LeftDefensiveMidfielder,
          PlayerPosition.RightWinger,
          PlayerPosition.RightStriker,
          PlayerPosition.CentralStriker,
          PlayerPosition.LeftStriker,
          PlayerPosition.LeftWinger
        ];
      case Formation.Four_Four_Two:
      default:
        return [
          PlayerPosition.Goalkeeper,
          PlayerPosition.RightBack,
          PlayerPosition.RightCenterBack,
          PlayerPosition.LeftCenterBack,
          PlayerPosition.LeftBack,
          PlayerPosition.RightMidfielder,
          PlayerPosition.RightCenterMidfielder,
          PlayerPosition.LeftCenterMidfielder,
          PlayerPosition.LeftMidfielder,
          PlayerPosition.RightStriker,
          PlayerPosition.LeftStriker
        ];
    }
  }
}
