/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { DataTable } from '../shared/tables/data-table/data-table';
import { TeamsService } from '../../services/teams.service';
import { calculateAge } from '../../utils/date-utils';
import { getPlayerPositionLabel } from '../../utils/position-utils';
import { Kit, Team } from '../../models/competition.model';
import { TeamKit } from '../team-kit/team-kit';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataTable,
    TeamKit
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnDestroy {
  teamName: string = "";
  managerID: string | null = null;
  managerName: string = "-";
  kit: Kit | undefined;
  competitionName: string = "";
  competitionID: string | null = null;
  stadiumName: string = "-";
  stadiumCity: string = "-";
  private readonly destroy$ = new Subject<void>();

  displayedColumnsFixtures = [
    { key: 'date', header: 'Date', width: '15%', sortable: undefined },
    { key: 'homeaway', width: '5%', sortable: false },
    { key: 'team', header: 'Team', align: 'end', headerClass:'text-end', cellClass:'text-end', sortable: false }
  ];
  fixtures = [
    { date: '15/06', homeaway: 'H', team: "Red Ones" },
    { date: '19/06', homeaway: 'A', team: "Blue Team" },
    { date: '26/06', homeaway: 'H', team: "The Green Flag" },
    { date: '30/06', homeaway: 'H', team: "The Orange Pirates" },
    { date: '5/07', homeaway: 'A', team: "The Old Purple" },
    { date: '9/07', homeaway: 'H', team: "The White Swan" },
  ];

  displayedColumns = [
    { key: 'name', header: 'Name', width: '30%' },
    { key: 'position', header: 'Position' },
    { key: 'age', header: 'Age', align: 'end', headerClass:'text-end', cellClass:'text-end' }
  ];
  people: Array<any> = [];
  showPlayersTable = false;

  constructor(
    private readonly teamsService: TeamsService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ){
    this.teamName = this.teamsService.CurrentTeam?.name ?? "Unknown Team";
    this.managerID = this.teamsService.CurrentTeam?.managerID ?? null;
    this.managerName = this.teamsService.CurrentTeam?.managerName ?? "-";
    this.updateStadiumInformation(this.teamsService.CurrentTeam);
    this.teamsService.currentTeamObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe((team) => {
        this.managerID = team.managerID ?? null;
        this.managerName = team.managerName ?? "-";
        this.updateStadiumInformation(team);
        this.cdr.markForCheck();
      });

    this.teamsService.getCurrentTeamDashboard().subscribe((dashboard) => {
      this.teamName = dashboard.teamName;
      this.managerID = dashboard.managerID ?? null;
      this.managerName = dashboard.managerName ?? "-";
      this.competitionName = dashboard.competitionName;
      this.competitionID = dashboard.competitionID ?? null;
      this.kit = dashboard.kit;
      (dashboard.players as Array<any>).forEach(element => {
        this.people.push({ name: element.name, age: calculateAge(element.dateOfBirth), position: getPlayerPositionLabel(element.playerTrainedPositions[0].playerPosition) });
      });
      this.showPlayersTable = true;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openCompetition(): void {
    if (this.competitionID) {
      this.router.navigate(['/competition', this.competitionID]);
    }
  }

  openSquad(): void {
    this.router.navigate(['/team', 'squad']);
  }

  openFixtures(): void {
    this.router.navigate(['/team', 'fixtures']);
  }

  openManagerProfile(): void {
    if (this.managerID) {
      this.router.navigate(['/manager-profile', this.managerID]);
    }
  }

  private updateStadiumInformation(team: Team | undefined): void {
    this.stadiumName = team?.stadium?.name ?? "-";
    this.stadiumCity = team?.stadium?.city ?? "-";
  }
}
