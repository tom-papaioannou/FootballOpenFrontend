/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { Observable, ReplaySubject } from 'rxjs';
import { Team } from '../models/competition.model';
import { Person } from '../models/player-enums.model';
import { TeamStaffMember } from '../models/team-staff.model';
import {
  TeamTacticPriority,
  TeamTacticPriorityType,
  UpdatePrimaryTeamTacticPriorityRequest,
  UpdateTeamTacticPrioritiesRequest
} from '../models/team-tactic-priority.model';

@Injectable({
  providedIn: 'root'
})
export class TeamsService {
  private readonly apiUrl = `${environment.apiUrl}/api/tactics`;
  private currentTeam: Team | undefined;
  private currentTeam$ = new ReplaySubject<Team>(1);

  get CurrentTeam(){
    return this.currentTeam;
  }

  set CurrentTeam(team: Team | undefined){
    this.currentTeam = team;
    if (team) {
      this.currentTeam$.next(team);
    }
  }

  get currentTeamObservable(): Observable<Team> {
    return this.currentTeam$.asObservable();
  }

  constructor(private readonly http: HttpClient) {}

  getCurrentTeam(): Observable<any>{
    return this.http.get(`${environment.apiUrl}/api/teams/getCurrentTeam`);
  }

  getTeamInformation(teamID: string): Observable<Team> {
    return this.http.get<Team>(`${environment.apiUrl}/api/teams/getTeamInformation/${teamID}`);
  }

  getTeamSquad(teamID: string): Observable<Person[]> {
    return this.http.get<Person[]>(`${environment.apiUrl}/api/teams/getTeamSquad/${teamID}`);
  }

  getTeamStaff(teamID: string): Observable<TeamStaffMember[]> {
    return this.http.get<TeamStaffMember[]>(`${environment.apiUrl}/api/teams/getTeamStaff/${teamID}`);
  }

  updatePlayerShirtNumber(teamID: string, personID: string, shirtNumber: number): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/api/teams/updatePlayerShirtNumber`, {
      teamID,
      personID,
      shirtNumber
    });
  }

  getTeamTacticPriorities(teamID: string): Observable<TeamTacticPriority[]> {
    return this.http.get<TeamTacticPriority[]>(`${environment.apiUrl}/api/teams/${teamID}/tactic-priorities`);
  }

  updateTeamTacticPriorities(
    teamID: string,
    type: TeamTacticPriorityType,
    personIDs: string[]
  ): Observable<void> {
    const request: UpdateTeamTacticPrioritiesRequest = { type, personIDs };

    return this.http.put<void>(`${environment.apiUrl}/api/teams/${teamID}/tactic-priorities`, request);
  }

  updatePrimaryTeamTacticPriority(
    teamID: string,
    type: TeamTacticPriorityType,
    personID: string
  ): Observable<void> {
    const request: UpdatePrimaryTeamTacticPriorityRequest = { personID };

    return this.http.patch<void>(
      `${environment.apiUrl}/api/teams/${teamID}/tactic-priorities/${type}/primary`,
      request
    );
  }

  getPlayerDetails(playerID: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/teams/getPlayerDetails/${playerID}`);
  }

  getManagerDetails(managerID: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/teams/getManagerDetails/${managerID}`);
  }

  getCoachDetails(coachID: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/teams/getCoachDetails/${coachID}`);
  }

  getManagerProfileSummary(managerID: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/teams/getManagerProfileSummary/${managerID}`);
  }

  getCurrentTeamDashboard(): Observable<any>{
    return this.http.get(`${environment.apiUrl}/api/teams/getCurrentTeamDashboard`);
  }
}
