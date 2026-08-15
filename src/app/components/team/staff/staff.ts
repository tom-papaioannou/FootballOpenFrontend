/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { Team } from '../../../models/competition.model';
import { INation } from '../../../models/nation.model';
import { TeamStaffMember } from '../../../models/team-staff.model';
import { getNationFlagUrl } from '../../../utils/nation-map-utils';
import { NationService } from '../../../services/nation.service';
import { TeamsService } from '../../../services/teams.service';
import { Card } from '../../shared/cards/card/card';
import { ColumnDef, DataTable } from '../../shared/tables/data-table/data-table';

interface StaffTableRow {
  personID: string;
  name: string;
  nationalityFlagUrl: string;
  nationalityName: string;
  role: 'Manager' | 'Coach' | 'Medic';
  wage: string;
  wageValue: number;
  contractEndDate: string;
  contractEndDateValue: string | null;
}

@Component({
  selector: 'app-staff',
  imports: [Card, DataTable],
  templateUrl: './staff.html',
  styleUrl: './staff.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true
})
export class Staff implements OnInit, OnDestroy {
  @ViewChild('nameTemplate', { static: true }) nameTemplate!: TemplateRef<{ $implicit: StaffTableRow; value: string }>;
  @ViewChild('nationalityTemplate', { static: true }) nationalityTemplate!: TemplateRef<{ $implicit: StaffTableRow; value: string }>;

  displayedColumns: ColumnDef<StaffTableRow>[] = [];
  staff: StaffTableRow[] = [];
  teamName = '';
  private nationsByID = new Map<string, INation>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly teamsService: TeamsService,
    private readonly nationService: NationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.displayedColumns = [
      {
        key: 'name',
        header: 'Name',
        width: '28%',
        sortable: true,
        cellTemplate: this.nameTemplate
      },
      {
        key: 'nationalityFlagUrl',
        header: 'Nationality',
        width: '22%',
        align: 'center',
        headerClass: 'text-center',
        cellClass: 'text-center',
        sortable: true,
        sortAccessor: row => row.nationalityName,
        cellTemplate: this.nationalityTemplate
      },
      { key: 'role', header: 'Role', width: '18%', sortable: true },
      {
        key: 'wage',
        header: 'Wage',
        width: '16%',
        align: 'right',
        headerClass: 'text-end',
        cellClass: 'text-end',
        sortable: true,
        sortAccessor: row => row.wageValue
      },
      {
        key: 'contractEndDate',
        header: 'Contract End',
        width: '16%',
        align: 'right',
        headerClass: 'text-end',
        cellClass: 'text-end',
        sortable: true,
        sortAccessor: row => row.contractEndDateValue
      }
    ];

    const routeTeamID = this.route.snapshot.paramMap.get('teamID');

    if (routeTeamID) {
      this.teamsService.getTeamInformation(routeTeamID)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: team => this.setTeam(team),
          error: error => console.error('Error getting team information:', error)
        });
      return;
    }

    this.teamsService.currentTeamObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: team => this.setTeam(team),
        error: error => console.error('Error getting current team:', error)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setTeam(team: Team): void {
    if (!team.teamID) {
      return;
    }

    this.teamName = team.name;
    this.loadStaff(team.teamID);
    this.cdr.markForCheck();
  }

  private loadStaff(teamID: string): void {
    forkJoin({
      staff: this.teamsService.getTeamStaff(teamID),
      nations: this.nationService.getAll()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ staff, nations }) => {
          this.nationsByID = new Map(nations.map(nation => [nation.nationID, nation]));
          this.staff = staff.map(member => this.toTableRow(member));
          this.cdr.markForCheck();
        },
        error: error => {
          console.error('Error fetching team staff:', error);
          this.staff = [];
          this.cdr.markForCheck();
        }
      });
  }

  private toTableRow(member: TeamStaffMember): StaffTableRow {
    const nation = member.nationID ? this.nationsByID.get(member.nationID) : undefined;

    return {
      personID: member.personID,
      name: `${member.name ?? ''} ${member.surname ?? ''}`.trim() || 'Unknown',
      nationalityFlagUrl: nation ? getNationFlagUrl(nation) : '',
      nationalityName: nation?.name ?? '',
      role: member.role,
      wage: `${member.wage} € / week`,
      wageValue: member.wage,
      contractEndDate: this.formatContractEndDate(member.endDate),
      contractEndDateValue: member.endDate ?? null
    };
  }

  openStaffProfile(event: MouseEvent, staffMember: StaffTableRow): void {
    event.stopPropagation();

    const route = staffMember.role === 'Manager'
      ? '/manager-profile'
      : staffMember.role === 'Coach' ? '/coach-profile' : '/medic-profile';
    this.router.navigate([route, staffMember.personID]);
  }

  private formatContractEndDate(endDate: string | null | undefined): string {
    if (!endDate) {
      return '-';
    }

    const date = new Date(endDate);
    if (isNaN(date.getTime())) {
      return '-';
    }

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getUTCFullYear()}`;
  }
}
