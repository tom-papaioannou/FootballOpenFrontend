/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, computed, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Card } from '../../shared/cards/card/card';
import { TacticsService } from '../../../services/tactics.service';
import { Tactic, CreateTacticRequest, Formation, PassingMentality, TacticMentality } from '../../../models/tactic.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TeamsService } from '../../../services/teams.service';
import { Kit } from '../../../models/competition.model';
import { Person, PlayerPosition } from '../../../models/player-enums.model';
import { TeamTacticPriority, TeamTacticPriorityType } from '../../../models/team-tactic-priority.model';
import {
  FORMATION_OPTIONS,
  getFormationLabel as getFormationDisplayLabel,
  getFormationPositions as getFormationPreviewPositions
} from '../../../utils/formation-utils';
import { getPositionPitchRow } from '../../../utils/position-utils';

interface FormationPreviewRow {
  rowIndex: number;
  positions: PlayerPosition[];
}

type PriorityTabID = 'captain' | 'penalty' | 'freeKick' | 'corner' | 'throwIn';

interface PriorityTab {
  id: PriorityTabID;
  label: string;
}

interface PriorityListConfig {
  key: string;
  label: string;
  type: TeamTacticPriorityType;
}

interface PriorityPlayerItem {
  personID: string;
  label: string;
}

@Component({
  selector: 'app-tactics',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Card,
    MatButtonModule,
    MatIconModule,
    CdkDropList,
    CdkDrag
  ],
  templateUrl: './tactics.html',
  styleUrl: './tactics.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Tactics implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly MAX_TACTICS = 3;
  
  // State signals
  tactics = signal<Tactic[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  createMode = signal(false);
  deleteConfirmationTactic = signal<Tactic | null>(null);
  teamKit = signal<Kit | null>(null);
  teamPlayers = signal<Person[]>([]);
  tacticPriorities = signal<TeamTacticPriority[]>([]);
  priorityLoading = signal(false);
  activePriorityTab = signal<PriorityTabID>('captain');
  openAddListKey = signal<string | null>(null);

  // Form
  tacticForm: FormGroup;

  // Formation options for dropdown
  formationOptions = FORMATION_OPTIONS;

  tacticMentalityOptions = [
    { value: TacticMentality.ExtremelyDefending, label: 'Extremely Defending' },
    { value: TacticMentality.Defending, label: 'Defending' },
    { value: TacticMentality.Balanced, label: 'Balanced' },
    { value: TacticMentality.Attacking, label: 'Attacking' },
    { value: TacticMentality.ExtremelyAttacking, label: 'Extremely Attacking' }
  ];

  passingMentalityOptions = [
    { value: PassingMentality.Short, label: 'Short' },
    { value: PassingMentality.Balanced, label: 'Balanced' },
    { value: PassingMentality.Long, label: 'Long' }
  ];

  readonly priorityTabs: PriorityTab[] = [
    { id: 'captain', label: 'Captain' },
    { id: 'penalty', label: 'Penalty' },
    { id: 'freeKick', label: 'Free Kick' },
    { id: 'corner', label: 'Corner' },
    { id: 'throwIn', label: 'Throw In' }
  ];

  private readonly priorityListsByTab: Record<PriorityTabID, PriorityListConfig[]> = {
    captain: [
      { key: 'captain', label: 'Captain', type: TeamTacticPriorityType.Captain }
    ],
    penalty: [
      { key: 'penalty', label: 'Penalty', type: TeamTacticPriorityType.Penalty }
    ],
    freeKick: [
      { key: 'right-free-kick', label: 'Right', type: TeamTacticPriorityType.RightFreeKick },
      { key: 'left-free-kick', label: 'Left', type: TeamTacticPriorityType.LeftFreeKick }
    ],
    corner: [
      { key: 'right-corner', label: 'Right', type: TeamTacticPriorityType.RightCornerKick },
      { key: 'left-corner', label: 'Left', type: TeamTacticPriorityType.LeftCornerKick }
    ],
    throwIn: [
      { key: 'right-throw-in', label: 'Right', type: TeamTacticPriorityType.RightThrowIn },
      { key: 'left-throw-in', label: 'Left', type: TeamTacticPriorityType.LeftThrowIn }
    ]
  };

  // Computed values
  canCreateNewTactic = computed(() => this.tactics().length < this.MAX_TACTICS);
  tacticsRemaining = computed(() => this.MAX_TACTICS - this.tactics().length);
  
  // Sorted tactics with isMain first
  sortedTactics = computed(() => {
    const tacticsList = [...this.tactics()];
    return tacticsList.sort((a, b) => {
      // Sort by isMain descending (true first, then false)
      if (a.isMain === b.isMain) return 0;
      return a.isMain ? -1 : 1;
    });
  });

  constructor(
    private readonly tacticsService: TacticsService,
    private readonly teamsService: TeamsService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router
  ) {
    this.tacticForm = this.fb.group({
      Name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]],
      isMain: [false],
      Formation: [Formation.None, [Validators.required]],
      TacticMentality: [TacticMentality.Balanced, [Validators.required]],
      PassingMentality: [PassingMentality.Balanced, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.teamKit.set(this.teamsService.CurrentTeam?.kit ?? null);

    // Wait for CurrentTeam to be set before loading tactics
    this.teamsService.currentTeamObservable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (team) => {
          this.teamKit.set(team.kit ?? null);
          // Only load tactics when we have a valid team
          if (team?.teamID) {
            this.loadTactics();
            this.loadTeamPlayers(team.teamID);
            this.loadTacticPriorities(team.teamID);
          }
        }
      });
  }

  loadTactics(): void {
    this.loading.set(true);
    this.error.set(null);

    this.tacticsService.getTeamTactics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tactics) => {
          this.tactics.set(tactics);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load tactics');
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  createNew(): void {
    if (!this.canCreateNewTactic()) {
      this.error.set(`Maximum of ${this.MAX_TACTICS} tactics reached. You cannot create more tactics.`);
      return;
    }
    
    this.createMode.set(true);
    this.tacticForm.reset(this.getDefaultCreateFormValue(`New Tactic (${this.tactics().length + 1})`));
    this.cdr.markForCheck();
  }

  saveTactic(): void {
    if (!this.tacticForm.valid) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const formValue = this.tacticForm.value;
    const name = (formValue.Name ?? '').trim();

    if (name.length < 1 || name.length > 30) {
      this.error.set('Tactic name must contain at least 1 non-space character and be at most 30 characters.');
      this.loading.set(false);
      this.cdr.markForCheck();
      return;
    }
    
    const createRequest: CreateTacticRequest = {
      TeamID: this.teamsService.CurrentTeam?.teamID ?? "",
      Name: name,
      isMain: formValue.isMain ?? false,
      Formation: formValue.Formation,
      TacticMentality: formValue.TacticMentality,
      PassingMentality: formValue.PassingMentality
    };

    this.tacticsService.createTeamTactic(createRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closeCreatePopup(true);
          this.loadTactics();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to create tactic');
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  cancel(): void {
    this.closeCreatePopup();
  }

  closeCreatePopup(force = false): void {
    if (this.loading() && !force) {
      return;
    }

    this.createMode.set(false);
    this.tacticForm.reset(this.getDefaultCreateFormValue(''));
    this.cdr.markForCheck();
  }

  toggleCreateMain(): void {
    if (this.loading()) {
      return;
    }

    this.tacticForm.patchValue({ isMain: !this.tacticForm.get('isMain')?.value });
  }

  selectPriorityTab(tabID: PriorityTabID): void {
    this.activePriorityTab.set(tabID);
    this.openAddListKey.set(null);
  }

  getActivePriorityLists(): PriorityListConfig[] {
    return this.priorityListsByTab[this.activePriorityTab()];
  }

  getPriorityItems(type: TeamTacticPriorityType): PriorityPlayerItem[] {
    const playersByID = new Map(this.teamPlayers().map(player => [player.personID, player]));

    return this.tacticPriorities()
      .filter(priority => priority.type === type)
      .sort((a, b) => a.priority - b.priority)
      .map(priority => {
        const player = playersByID.get(priority.personID);

        return {
          personID: priority.personID,
          label: player ? this.getPlayerFullName(player) : 'Unknown Player'
        };
      });
  }

  getAvailablePriorityPlayers(type: TeamTacticPriorityType): Person[] {
    const assignedPlayerIDs = new Set(this.getPriorityItems(type).map(item => item.personID));

    return this.teamPlayers()
      .filter(player => !assignedPlayerIDs.has(player.personID))
      .sort((a, b) => this.getPlayerFullName(a).localeCompare(this.getPlayerFullName(b)));
  }

  toggleAddPlayers(listKey: string): void {
    this.openAddListKey.set(this.openAddListKey() === listKey ? null : listKey);
  }

  addPriorityPlayer(type: TeamTacticPriorityType, personID: string): void {
    const nextPersonIDs = [...this.getPriorityItems(type).map(item => item.personID), personID];
    this.savePriorityList(type, nextPersonIDs);
    this.openAddListKey.set(null);
  }

  removePriorityPlayer(type: TeamTacticPriorityType, personID: string): void {
    const nextPersonIDs = this.getPriorityItems(type)
      .map(item => item.personID)
      .filter(id => id !== personID);

    this.savePriorityList(type, nextPersonIDs);
  }

  dropPriorityPlayer(type: TeamTacticPriorityType, event: CdkDragDrop<PriorityPlayerItem[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const nextItems = [...event.container.data];
    moveItemInArray(nextItems, event.previousIndex, event.currentIndex);
    this.savePriorityList(type, nextItems.map(item => item.personID));
  }

  getPlayerFullName(player: Person): string {
    return `${player.name ?? ''} ${player.surname ?? ''}`.trim() || 'Unknown Player';
  }

  private getDefaultCreateFormValue(name: string): Record<string, unknown> {
    return {
      Name: name,
      isMain: false,
      Formation: Formation.Four_Four_Two,
      TacticMentality: TacticMentality.Balanced,
      PassingMentality: PassingMentality.Balanced
    };
  }

  private loadTeamPlayers(teamID: string): void {
    this.teamsService.getTeamSquad(teamID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (players) => {
          this.teamPlayers.set([...players].sort((a, b) => this.getPlayerFullName(a).localeCompare(this.getPlayerFullName(b))));
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load team players');
          this.cdr.markForCheck();
        }
      });
  }

  private loadTacticPriorities(teamID: string): void {
    this.priorityLoading.set(true);

    this.teamsService.getTeamTacticPriorities(teamID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (priorities) => {
          this.tacticPriorities.set(priorities);
          this.priorityLoading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load tactic priorities');
          this.priorityLoading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  private savePriorityList(type: TeamTacticPriorityType, personIDs: string[]): void {
    const teamID = this.teamsService.CurrentTeam?.teamID;

    if (!teamID) {
      this.error.set('Cannot save priorities: missing team information.');
      return;
    }

    this.priorityLoading.set(true);
    this.error.set(null);

    this.teamsService.updateTeamTacticPriorities(teamID, type, personIDs)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.replacePriorityList(type, personIDs);
          this.priorityLoading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to save tactic priorities');
          this.priorityLoading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  private replacePriorityList(type: TeamTacticPriorityType, personIDs: string[]): void {
    const teamTacticPriorityIDPrefix = `local-${type}`;
    const otherPriorities = this.tacticPriorities().filter(priority => priority.type !== type);
    const nextPriorities = personIDs.map((personID, index) => ({
      teamTacticPriorityID: `${teamTacticPriorityIDPrefix}-${personID}`,
      personID,
      type,
      priority: index + 1
    }));

    this.tacticPriorities.set([...otherPriorities, ...nextPriorities]);
  }

  openDeletePopup(tactic: Tactic, event: Event): void {
    // Prevent card click event from triggering
    event.stopPropagation();
    this.deleteConfirmationTactic.set(tactic);
    this.cdr.markForCheck();
  }

  closeDeletePopup(): void {
    if (this.loading()) {
      return;
    }

    this.deleteConfirmationTactic.set(null);
    this.cdr.markForCheck();
  }

  confirmDeleteTactic(): void {
    const tactic = this.deleteConfirmationTactic();

    if (!tactic) {
      return;
    }

    if (!tactic.tacticID) {
      this.error.set('Cannot delete tactic: missing ID');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.tacticsService.deleteTactic(tactic.tacticID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.deleteConfirmationTactic.set(null);
          this.loading.set(false);
          this.loadTactics();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to delete tactic');
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  getFormationPreviewRows(formation?: Formation): FormationPreviewRow[] {
    const positions = this.getFormationPositions(formation);
    const rowMap = new Map<number, PlayerPosition[]>();

    for (const position of positions) {
      const row = getPositionPitchRow(position);
      if (row < 0) continue;

      if (!rowMap.has(row)) {
        rowMap.set(row, []);
      }

      rowMap.get(row)!.push(position);
    }

    const rows = Array.from(rowMap.entries()).map(([rowIndex, rowPositions]) => ({
      rowIndex,
      positions: rowPositions.sort((a, b) => b - a)
    }));

    return rows.sort((a, b) => b.rowIndex - a.rowIndex);
  }

  getPreviewRowClass(row: FormationPreviewRow): string {
    return row.positions.length <= 2 ? 'formation-preview-row centered' : 'formation-preview-row spaced';
  }

  getFormationLabel(formation?: Formation): string {
    return getFormationDisplayLabel(formation);
  }

  getTacticMentalityLabel(tacticMentality?: TacticMentality): string {
    switch (tacticMentality) {
      case TacticMentality.ExtremelyDefending:
        return 'Extra Defend';
      case TacticMentality.Defending:
        return 'Defend';
      case TacticMentality.Attacking:
        return 'Attack';
      case TacticMentality.ExtremelyAttacking:
        return 'Extra Attack';
      case TacticMentality.Balanced:
      default:
        return 'Balance';
    }
  }

  getPassingMentalityLabel(passingMentality?: PassingMentality): string {
    switch (passingMentality) {
      case PassingMentality.Short:
        return 'Short';
      case PassingMentality.Long:
        return 'Long';
      case PassingMentality.Balanced:
      default:
        return 'Balance';
    }
  }

  getHomeShirtColor(): string {
    return this.teamKit()?.homeShirtColor || 'rgb(207, 73, 73)';
  }

  getHomeShortsColor(): string {
    return this.teamKit()?.homeShortsColor || 'rgba(0, 0, 0, 0.6)';
  }

  private getFormationPositions(formation?: Formation): PlayerPosition[] {
    return getFormationPreviewPositions(formation);
  }

  viewTacticDetails(tactic: Tactic): void {
    if (!tactic.tacticID) {
      this.error.set('Cannot view tactic: missing ID');
      return;
    }

    this.router.navigate(['/team/tactics', tactic.tacticID]);
  }
}
