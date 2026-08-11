/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

// Competition enums matching backend
export enum CompetitionTeamsType {
  None = 0,
  NationalTeams = 1,
  Clubs = 2
}

export enum CompetitionType {
  None = 0,
  League = 1,
  Knockout = 2,
  Mixed = 3
}

export enum CupRoundType {
  RoundOf64 = 1,
  RoundOf32 = 2,
  RoundOf16 = 3,
  QuarterFinal = 4,
  SemiFinal = 5,
  Final = 6
}

export enum KitShape {
  Empty = 0,
  StripedFiveLines = 1,
  StripedSevenLines = 2,
  DiagonalStripe = 3,
  HalfAndHalf = 4
}

// Competition model for managing competitions under nations or continents
export interface Competition {
  competitionID?: string;
  competitionName: string;
  nationID?: string;
  continentID?: string;
  nation?: CompetitionParent | null;
  continent?: CompetitionParent | null;
  priority?: number;
  competitionTeamsType?: CompetitionTeamsType;
  competitionType?: CompetitionType;
  teams?: Team[];
}

export interface CompetitionParent {
  name?: string | null;
  iso2?: string | null;
  iSO2?: string | null;
  isO2?: string | null;
  code?: string | null;
  flagUrl?: string | null;
}

export interface CompetitionTableRow {
  position: number;
  teamID: string;
  teamName: string;
  points: number;
  wins: number;
  draws: number;
  losses: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

export interface CupBracket {
  competitionID: string;
  rounds: CupBracketRound[];
}

export interface CupBracketRound {
  cupRoundID: string;
  roundNumber: number;
  teamCount: number;
  roundType: CupRoundType;
  ties: CupBracketTie[];
}

export interface CupBracketTie {
  cupTieID: string;
  cupRoundID: string;
  tieNumber: number;
  homeTeamID?: string | null;
  awayTeamID?: string | null;
  winnerTeamID?: string | null;
  nextCupTieID?: string | null;
  advancesAsHomeTeam: boolean;
  isCompleted: boolean;
  homeTeam?: CupBracketTeam | null;
  awayTeam?: CupBracketTeam | null;
  winnerTeam?: CupBracketTeam | null;
}

export interface CupBracketTeam {
  teamID: string;
  name?: string | null;
  badgeColor?: string | null;
}

export interface TeamCompetitions {
  teamID: string;
  competitions: Competition[];
}

export interface Team {
  teamID?: string;
  name: string;
  leagueID?: string | null;
  leagueName?: string | null;
  managerID?: string | null;
  managerName?: string | null;
  isOwned?: boolean;
  stadium?: Stadium;
  kit: Kit;
}

export interface Kit {
  homeShirtColor: string;
  homeShortsColor: string;
  awayShirtColor: string;
  awayShortsColor: string;
  kitShape?: KitShape | keyof typeof KitShape | string | null;
}

export interface Stadium {
  stadiumID?: string;
  name: string;
  city?: string;
  latitude: number;
  longitude: number;
  capacity: number;
}

export interface CompetitionPayload {
  CompetitionName: string;
  NationID?: string;
  ContinentID?: string;
  CompetitionTeamsType: CompetitionTeamsType;
  Priority: number;
  CompetitionType: CompetitionType;
  ServerID?: string | null;
}

