export enum TeamTacticPriorityType {
  Captain = 0,
  Penalty = 1,
  RightFreeKick = 2,
  LeftFreeKick = 3,
  RightCornerKick = 4,
  LeftCornerKick = 5,
  RightThrowIn = 6,
  LeftThrowIn = 7
}

export interface TeamTacticPriority {
  teamTacticPriorityID: string;
  personID: string;
  type: TeamTacticPriorityType;
  priority: number;
}

export interface UpdateTeamTacticPrioritiesRequest {
  type: TeamTacticPriorityType;
  personIDs: string[];
}

export interface UpdatePrimaryTeamTacticPriorityRequest {
  personID: string;
}
