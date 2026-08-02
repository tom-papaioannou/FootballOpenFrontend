/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, OnDestroy, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { CdkDrag, CdkDragStart, CdkDragMove, CdkDragEnd, CdkDropList, CdkDragPlaceholder } from '@angular/cdk/drag-drop';
import { TacticsService } from '../../../services/tactics.service';
import { Tactic, Formation, PassingMentality, PlayerTactic, SquadUnit, TacticMentality, UpdateTacticRequest } from '../../../models/tactic.model';
import { TeamsService } from '../../../services/teams.service';
import { Kit } from '../../../models/competition.model';
import { Person, PlayerPosition, PlayerRole } from '../../../models/player-enums.model';
import { Card } from '../../shared/cards/card/card';
import {
  getGroupedPlayerPositionLabel,
  getPlayerPositionLabel,
  getPlayerRoleLabel,
  positionSortOrder,
  getPositionPitchRow
} from '../../../utils/position-utils';
import { FormsModule } from '@angular/forms';

function getPlayerRoleOptionLabel(role: PlayerRole): string {
  if (role === PlayerRole.None) {
    return 'None';
  }

  const abbreviation = getPlayerRoleLabel(role);

  return `${abbreviation}`;
}

function getAvailableRolesForPosition(position: PlayerPosition): PlayerRole[] {
  switch (position) {
    case PlayerPosition.Goalkeeper:
      return [
        PlayerRole.Goalkeeper,
        PlayerRole.SweeperKeeper
      ];

    case PlayerPosition.RightCenterBack:
    case PlayerPosition.CentralCenterBack:
    case PlayerPosition.LeftCenterBack:
      return [
        PlayerRole.CenterBack,
        PlayerRole.BallPlayingDefender,
        PlayerRole.NoNonsenseCenterBack,
        PlayerRole.Libero,
        PlayerRole.Stopper,
        PlayerRole.Cover
      ];

    case PlayerPosition.RightBack:
    case PlayerPosition.LeftBack:
    case PlayerPosition.RightWingBack:
    case PlayerPosition.LeftWingBack:
      return [
        PlayerRole.FullBack,
        PlayerRole.WingBack,
        PlayerRole.CompleteWingBack,
        PlayerRole.InvertedWingBack,
        PlayerRole.WideCenterBack
      ];

    case PlayerPosition.RightDefensiveMidfielder:
    case PlayerPosition.CentralDefensiveMidfielder:
    case PlayerPosition.LeftDefensiveMidfielder:
      return [
        PlayerRole.DefensiveMidfielder,
        PlayerRole.Anchorman,
        PlayerRole.HalfBack,
        PlayerRole.DeepLyingPlaymaker,
        PlayerRole.Regista,
        PlayerRole.Volante,
        PlayerRole.SegundoVolante,
        PlayerRole.BallWinningMidfielder
      ];

    case PlayerPosition.RightCenterMidfielder:
    case PlayerPosition.CentralCenterMidfielder:
    case PlayerPosition.LeftCenterMidfielder:
      return [
        PlayerRole.CentralMidfielder,
        PlayerRole.BoxToBoxMidfielder,
        PlayerRole.Mezzala,
        PlayerRole.Carrilero,
        PlayerRole.AdvancedPlaymaker,
        PlayerRole.RoamingPlaymaker
      ];

    case PlayerPosition.RightMidfielder:
    case PlayerPosition.LeftMidfielder:
    case PlayerPosition.RightWinger:
    case PlayerPosition.LeftWinger:
      return [
        PlayerRole.WideMidfielder,
        PlayerRole.WidePlaymaker,
        PlayerRole.Winger,
        PlayerRole.InvertedWinger,
        PlayerRole.InsideForward,
        PlayerRole.InvertedForward,
        PlayerRole.Raumdeuter,
        PlayerRole.WideTargetMan,
        PlayerRole.DefensiveWinger
      ];

    case PlayerPosition.RightAttackingMidfielder:
    case PlayerPosition.CentralAttackingMidfielder:
    case PlayerPosition.LeftAttackingMidfielder:
      return [
        PlayerRole.AttackingMidfielder,
        PlayerRole.ShadowStriker,
        PlayerRole.Enganche,
        PlayerRole.Trequartista,
        PlayerRole.SecondStriker,
        PlayerRole.FalseTen,
        PlayerRole.CentralWinger
      ];

    case PlayerPosition.RightStriker:
    case PlayerPosition.CentralStriker:
    case PlayerPosition.LeftStriker:
      return [
        PlayerRole.AdvancedForward,
        PlayerRole.CompleteForward,
        PlayerRole.Poacher,
        PlayerRole.TargetMan,
        PlayerRole.DeepLyingForward,
        PlayerRole.PressingForward,
        PlayerRole.DefensiveForward,
        PlayerRole.FalseNine,
        PlayerRole.TrequartistaForward
      ];

    default:
      return [];
  }
}

function getAvailableRoleOptionsForPosition(position: PlayerPosition): { value: PlayerRole; label: string }[] {
  return getAvailableRolesForPosition(position).map(value => ({
    value,
    label: getPlayerRoleOptionLabel(value)
  }));
}

interface PlayerRoleOptionWithAdaptation {
  value: PlayerRole;
  label: string;
}

interface PlayerSwapOption {
  playerTacticID: string;
  label: string;
}

interface PlayerSwapParticipant {
  playerTacticID?: string;
}

interface TacticEditModel {
  name: string;
  isMain: boolean;
  formation: Formation;
  tacticMentality: TacticMentality;
  passingMentality: PassingMentality;
}

export interface PitchRowPlayer {
  position: number;
  positionLabel: string;
  playerName: string;
  displayNumber: number;
  playerTacticID?: string;
  personID?: string;
  role: PlayerRole;
}

export interface PitchRow {
  rowIndex: number;
  players: PitchRowPlayer[];
  isGoalkeeper: boolean;
}

/** Shape of each row displayed in the player tactics drop-list. */
export interface PlayerTacticTableRow {
  playerName: string;
  position: string;
  positionValue: number;
  roleValue: PlayerRole;
  suitability: number;
  bestTrainedPosition: string;
  bestTrainedRole: string;
  playerTacticID: string | undefined;
  person?: Person;
  squadUnit: SquadUnit;
  substituteOrder: number;
}

@Component({
  selector: 'app-tactics-detail',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    CdkDrag,
    CdkDropList,
    CdkDragPlaceholder,
    Card,
    FormsModule
],
  templateUrl: './tactics-detail.html',
  styleUrl: './tactics-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TacticsDetail implements OnInit, OnDestroy {
  readonly SquadUnit = SquadUnit;

  private readonly destroyRef: DestroyRef;
  private readonly route: ActivatedRoute;
  private readonly router: Router;
  
  // State signals
  tactic = signal<Tactic | null>(null);
  playerTactics = signal<PlayerTactic[]>([]);
  teamKit = signal<Kit | null>(null);
  loading = signal(false);
  editSaving = signal(false);
  error = signal<string | null>(null);
  tacticId = signal<string | null>(null);
  editPopupOpen = signal(false);
  editModel = signal<TacticEditModel>({
    name: '',
    isMain: false,
    formation: Formation.Four_Four_Two,
    tacticMentality: TacticMentality.Balanced,
    passingMentality: PassingMentality.Balanced
  });

  /** Tracks the position of the currently dragged player (null when not dragging) */
  draggedPosition = signal<number | null>(null);

  /** Reference to the DOM element currently being hovered during drag */
  private hoveredElement: HTMLElement | null = null;

  /** Reference to the list row currently being hovered during a table-row drag. */
  private hoveredListRowElement: HTMLElement | null = null;

  /** Player currently shown in the detail popup. */
  selectedPlayer = signal<PlayerTacticTableRow | null>(null);

  formationOptions = [
    { value: Formation.Four_Four_Two, label: '4-4-2' },
    { value: Formation.Four_Three_Three, label: '4-3-3' },
    { value: Formation.Three_Five_Two, label: '3-5-2' },
    { value: Formation.Five_Three_Two, label: '5-3-2' },
    { value: Formation.Four_Five_One, label: '4-5-1' }
  ];

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

  /** Player tactic ids with a role update in flight. */
  private updatingRoleIds = signal<Set<string>>(new Set());

  /** Timer handle for the debounced hover removal (0.25 s after pointer leaves a target) */
  private hoverRemovalTimer: ReturnType<typeof setTimeout> | null = null;

  /** Swap pairs currently in flight, used to ignore duplicate CDK drop/end emissions. */
  private activeSwapKeys = new Set<string>();

  /**
   * Computed signal that groups playerTactics into pitch rows for the visual layout.
   * Each row contains players sorted left-to-right (descending enum value).
   * Rows are sorted top-to-bottom (highest row index first: strikers → GK).
   */
  pitchRows = computed<PitchRow[]>(() => {
    const tactics = this.playerTactics();
    if (!tactics.length) return [];

    const rowMap = new Map<number, PitchRowPlayer[]>();

    for (const pt of tactics) {
      // Only show starting players (squadUnit 0) on the pitch
      if (pt.squadUnit !== SquadUnit.Starting) continue;
      const row = getPositionPitchRow(pt.playerPosition);
      if (row < 0) continue;

      const playerName = pt.person
        ? this.getPitchPlayerName(pt.person)
        : 'Unknown Player';

      const player: PitchRowPlayer = {
        position: pt.playerPosition,
        positionLabel: getPlayerPositionLabel(pt.playerPosition),
        playerName,
        displayNumber: positionSortOrder[pt.playerPosition] ?? 0,
        playerTacticID: pt.playerTacticID,
        personID: pt.personID ?? pt.person?.personID,
        role: pt.playerRole
      };

      if (!rowMap.has(row)) {
        rowMap.set(row, []);
      }
      rowMap.get(row)!.push(player);
    }

    // Sort players within each row: descending position enum value = left to right
    const rows: PitchRow[] = [];
    for (const [rowIndex, players] of rowMap) {
      players.sort((a, b) => b.position - a.position);
      rows.push({
        rowIndex,
        players,
        isGoalkeeper: rowIndex === 0
      });
    }

    // Sort rows: highest row index first (strikers at top, GK at bottom)
    rows.sort((a, b) => b.rowIndex - a.rowIndex);

    return rows;
  });

  constructor(
    private readonly tacticsService: TacticsService,
    private readonly teamsService: TeamsService,
    private readonly cdr: ChangeDetectorRef,
    private readonly elementRef: ElementRef,
    route: ActivatedRoute,
    router: Router,
    destroyRef: DestroyRef
  ) {
    this.route = route;
    this.router = router;
    this.destroyRef = destroyRef;
  }

  ngOnInit(): void {
    this.teamKit.set(this.teamsService.CurrentTeam?.kit ?? null);
    this.teamsService.currentTeamObservable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (team) => {
          this.teamKit.set(team.kit ?? null);
          this.cdr.markForCheck();
        }
      });

    const tacticId = this.route.snapshot.paramMap.get('id');
    if (!tacticId) {
      this.error.set('No tactic ID provided');
      return;
    }
    
    this.tacticId.set(tacticId);
    this.loadTacticDetails(tacticId);
  }

  ngOnDestroy(): void {
    this.clearHoverTimer();
    this.clearListRowHoverState();
  }

  loadTacticDetails(tacticId: string): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      tactic: this.tacticsService.getTeamTactic(tacticId),
      playerTactics: this.tacticsService.getPlayerTactics(tacticId)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ tactic, playerTactics }) => {
          if (!tactic) {
            this.error.set('Tactic not found');
            this.loading.set(false);
            this.cdr.markForCheck();
            return;
          }
          
          this.tactic.set(tactic);
          this.playerTactics.set(playerTactics);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to load tactic details');
          this.loading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Returns the CSS layout classes for a given pitch row.
   */
  getRowClasses(row: PitchRow): string {
    if (row.isGoalkeeper) {
      return 'justify-center h-1/8';
    }
    return row.players.length <= 2 ? 'justify-center gap-10' : 'justify-around';
  }

  goBack(): void {
    this.router.navigate(['/team/tactics']);
  }

  openEditPopup(): void {
    const tactic = this.tactic();
    if (!tactic) {
      return;
    }

    this.editModel.set({
      name: tactic.name,
      isMain: tactic.isMain,
      formation: tactic.formation ?? Formation.Four_Four_Two,
      tacticMentality: tactic.tacticMentality ?? TacticMentality.Balanced,
      passingMentality: tactic.passingMentality ?? PassingMentality.Balanced
    });
    this.editPopupOpen.set(true);
  }

  closeEditPopup(): void {
    if (this.editSaving()) {
      return;
    }

    this.editPopupOpen.set(false);
  }

  saveTacticEdit(): void {
    const tactic = this.tactic();
    const tacticID = this.tacticId();
    const model = this.editModel();
    const name = model.name.trim();

    if (!tactic || !tacticID) {
      this.error.set('Cannot update tactic: missing tactic information.');
      return;
    }

    if (name.length < 1 || name.length > 30) {
      this.error.set('Tactic name must be between 1 and 30 characters.');
      return;
    }

    const request: UpdateTacticRequest = {
      name,
      isMain: model.isMain,
      formation: Number(model.formation) as Formation,
      tacticMentality: Number(model.tacticMentality) as TacticMentality,
      passingMentality: Number(model.passingMentality) as PassingMentality
    };
    const previousFormation = tactic.formation ?? Formation.Four_Four_Two;

    this.editSaving.set(true);
    this.error.set(null);

    this.tacticsService.updateTeamTactic(tacticID, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedTactic) => {
          this.tactic.set(updatedTactic);
          this.editPopupOpen.set(false);
          this.editSaving.set(false);

          const nextFormation = updatedTactic.formation ?? previousFormation;

          if (nextFormation !== previousFormation) {
            this.selectedPlayer.set(null);
            this.loadTacticDetails(tacticID);
            return;
          }

          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error.set(err.message || 'Failed to update tactic');
          this.editSaving.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  getHomeShirtColor(): string {
    return this.teamKit()?.homeShirtColor || 'rgb(207, 73, 73)';
  }

  getHomeShortsColor(): string {
    return this.teamKit()?.homeShortsColor || 'rgba(0, 0, 0, 0.6)';
  }

  private getPitchPlayerName(player: Person): string {
    const nameInitial = player.name?.substring(0, 1) || '';
    const surname = player.surname || '';
    const displaySurname = surname.length > 10 ? `${surname.substring(0, 10)}...` : surname;

    return `${nameInitial}. ${displaySurname}`.trim() || 'Unknown Player';
  }

  // Transform playerTactics for table display, grouped by squad unit:
  // Starting players (0) sorted by position, Substitutes (1) sorted by substituteOrder, Reserves (2) in default order
  get tableData(): PlayerTacticTableRow[] {
    const all: PlayerTacticTableRow[] = this.playerTactics().map(pt => {
      const playerName = pt.person ? `${pt.person.name?.substring(0, 1) || ''}. ${pt.person.surname || ''}`.trim() || 'Unknown Player'
        : 'Unknown Player';
      return {
        playerName,
        position: pt.squadUnit === SquadUnit.Starting ? getPlayerPositionLabel(pt.playerPosition) : (pt.squadUnit === SquadUnit.Substitute ? `S${pt.substituteOrder ?? ''}` : 'Res'),
        positionValue: pt.playerPosition, // Include raw enum value for sorting
        roleValue: pt.playerRole,
        suitability: this.getPlayerSuitability(pt.person, pt.playerPosition, pt.playerRole),
        bestTrainedPosition: getGroupedPlayerPositionLabel(this.getBestTrainedPosition(pt.person)),
        bestTrainedRole: getPlayerRoleLabel(this.getBestTrainedRole(pt.person)),
        playerTacticID: pt.playerTacticID,
        person: pt.person,
        squadUnit: pt.squadUnit,
        substituteOrder: pt.substituteOrder ?? Number.MAX_SAFE_INTEGER
      };
    });

    const starting = all
      .filter(p => p.squadUnit === SquadUnit.Starting)
      .sort((a, b) => (positionSortOrder[a.positionValue] ?? 999) - (positionSortOrder[b.positionValue] ?? 999));
    const substitutes = all
      .filter(p => p.squadUnit === SquadUnit.Substitute)
      .sort((a, b) => a.substituteOrder - b.substituteOrder);
    const reserves = all.filter(p => p.squadUnit === SquadUnit.Reserve);

    return [...starting, ...substitutes, ...reserves];
  }

  get mainTableData(): PlayerTacticTableRow[] {
    return this.tableData.filter(p => p.squadUnit !== SquadUnit.Reserve);
  }

  get reserveTableData(): PlayerTacticTableRow[] {
    return this.tableData.filter(p => p.squadUnit === SquadUnit.Reserve);
  }

  isRoleUpdating(playerTacticID: string | undefined): boolean {
    return !!playerTacticID && this.updatingRoleIds().has(playerTacticID);
  }

  getPlayerRoleOptions(position: number): { value: PlayerRole; label: string }[] {
    return getAvailableRoleOptionsForPosition(position);
  }

  getPlayerPopupRoleOptions(player: PlayerTacticTableRow): PlayerRoleOptionWithAdaptation[] {
    return getAvailableRolesForPosition(player.positionValue).map(role => ({
      value: role,
      label: `${getPlayerRoleLabel(role)} - ${this.getPlayerRoleAdaptation(player, role)}`
    }));
  }

  getPlayerPositionAdaptation(player: PlayerTacticTableRow): number {
    return this.getPlayerPositionAdaptationForPosition(player.person, player.positionValue);
  }

  getPlayerRoleAdaptation(player: PlayerTacticTableRow, roleValue: PlayerRole): number {
    return this.getPlayerRoleAdaptationForRole(player.person, player.positionValue, roleValue);
  }

  private getPlayerSuitability(person: Person | undefined, positionValue: PlayerPosition, roleValue: PlayerRole): number {
    const positionAdaptation = this.getPlayerPositionAdaptationForPosition(person, positionValue);
    const roleAdaptation = this.getPlayerRoleAdaptationForRole(person, positionValue, roleValue);

    return Math.floor((positionAdaptation + roleAdaptation) / 2);
  }

  private getPlayerPositionAdaptationForPosition(person: Person | undefined, positionValue: PlayerPosition): number {
    return person?.playerTrainedPositions
      ?.find(position => position.playerPosition === positionValue)
      ?.playerTrainedPositionAdaptation ?? 0;
  }

  private getPlayerRoleAdaptationForRole(person: Person | undefined, positionValue: PlayerPosition, roleValue: PlayerRole): number {
    const roles = person?.playerTrainedRoles;
    if (!roles?.length) {
      return 0;
    }

    return roles.find(role => role.playerPosition === positionValue && role.playerRole === roleValue)
      ?.playerTrainedRoleAdaptation
      ?? roles.find(role => role.playerPosition === undefined && role.playerRole === roleValue)
        ?.playerTrainedRoleAdaptation
      ?? 0;
  }

  openPlayerPopup(player: PlayerTacticTableRow, event?: Event): void {
    event?.stopPropagation();
    this.selectedPlayer.set(player);
  }

  closePlayerPopup(): void {
    this.selectedPlayer.set(null);
  }

  viewPlayerProfile(player: PlayerTacticTableRow, event?: Event): void {
    event?.stopPropagation();

    const personID = player.person?.personID;
    if (!personID) {
      return;
    }

    this.closePlayerPopup();
    this.router.navigate(['/player', personID]);
  }

  viewPitchPlayerProfile(player: PitchRowPlayer, event?: Event): void {
    event?.stopPropagation();

    if (!player.personID) {
      return;
    }

    this.router.navigate(['/player', player.personID]);
  }

  onPopupRoleChange(player: PlayerTacticTableRow, event: Event): void {
    this.onPlayerRoleChange(player, event);
  }

  getPlayerSwapOptions(player: PlayerTacticTableRow): PlayerSwapOption[] {
    return this.tableData
      .filter(option => option.playerTacticID && option.playerTacticID !== player.playerTacticID)
      .map(option => ({
        playerTacticID: option.playerTacticID!,
        label: `${option.position} - ${option.playerName}`
      }));
  }

  onPopupSwapChange(player: PlayerTacticTableRow, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const targetPlayerTacticID = select.value;

    if (!player.playerTacticID || !targetPlayerTacticID) {
      select.value = '';
      return;
    }

    this.swapPlayerTactics(player.playerTacticID, targetPlayerTacticID, 'Error swapping players from popup:', () => {
      this.closePlayerPopup();
    }, () => {
      select.value = '';
    });
  }

  private getBestTrainedPosition(person: Person | undefined): PlayerPosition | undefined {
    if (!person?.playerTrainedPositions?.length) {
      return undefined;
    }

    return person.playerTrainedPositions.reduce((best, position) =>
      position.playerTrainedPositionAdaptation > best.playerTrainedPositionAdaptation ? position : best
    )?.playerPosition;
  }

  private getBestTrainedRole(person: Person | undefined): PlayerRole | undefined {
    if (!person?.playerTrainedRoles?.length) {
      return undefined;
    }

    let bestPosition = this.getBestTrainedPosition(person);

    return person.playerTrainedRoles.reduce((best, role) => 
      role.playerPosition === bestPosition &&
      (role.playerTrainedRoleAdaptation > best.playerTrainedRoleAdaptation) ? role : best
    )?.playerRole;
  }

  onPlayerRoleChange(player: PlayerTacticTableRow, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const nextRole = Number(select.value) as PlayerRole;
    const previousRole = player.roleValue;
    const teamID = this.tactic()?.teamID;

    if (!player.playerTacticID || !teamID) {
      select.value = String(previousRole);
      this.error.set('Cannot update player role: missing tactic or team information.');
      this.cdr.markForCheck();
      return;
    }

    if (player.squadUnit !== SquadUnit.Starting) {
      select.value = String(previousRole);
      this.error.set('Only starting squad player roles can be updated.');
      this.cdr.markForCheck();
      return;
    }

    if (!getAvailableRolesForPosition(player.positionValue).includes(nextRole)) {
      select.value = String(previousRole);
      this.error.set('Selected role is not available for this player position.');
      this.cdr.markForCheck();
      return;
    }

    if (nextRole === previousRole) {
      return;
    }

    this.error.set(null);
    this.setRoleUpdateInProgress(player.playerTacticID, true);
    this.updatePlayerRoleInState(player.playerTacticID, nextRole);

    this.tacticsService.updateStartingPlayerRole(teamID, player.playerTacticID, nextRole)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedPlayerTactic) => {
          this.replacePlayerTacticInState(updatedPlayerTactic);
          this.setRoleUpdateInProgress(player.playerTacticID!, false);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.updatePlayerRoleInState(player.playerTacticID!, previousRole);
          this.setRoleUpdateInProgress(player.playerTacticID!, false);
          this.error.set(err.message || 'Failed to update player role');
          this.cdr.markForCheck();
        }
      });
  }

  /** Called when a player node drag begins. Shows a black dot at the original position. */
  onDragStarted(_event: CdkDragStart, player: PitchRowPlayer): void {
    this.draggedPosition.set(player.position);
    this.clearListRowHoverState();
  }

  /** Called on every pointer move during drag. Detects hover over other player nodes. */
  onDragMoved(event: CdkDragMove, player?: PlayerSwapParticipant): void {
    this.updateHoveredPitchNode(event, true);

    if (player) {
      this.updateHoveredListRow(event, player);
    }
  }

  private updateHoveredPitchNode(event: CdkDragMove, debounceRemoval: boolean): void {
    const { x, y } = event.pointerPosition;
    const dragElement = event.source.element.nativeElement;

    // Find the player node (if any) under the current pointer position
    let foundTarget: HTMLElement | null = null;
    const allPlayerNodes = this.elementRef.nativeElement.querySelectorAll('.player-node');
    for (const node of Array.from(allPlayerNodes)) {
      if (node === dragElement) continue;
      const rect = (node as HTMLElement).getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        foundTarget = node as HTMLElement;
        break;
      }
    }

    if (foundTarget) {
      if (foundTarget === this.hoveredElement) {
        // Still hovering the same target – cancel any pending removal
        this.clearHoverTimer();
      } else {
        // Hovering a *different* target – immediately swap
        this.clearHoverState();
        foundTarget.classList.add('drag-hover-target');
        this.hoveredElement = foundTarget;
      }
    } else if (this.hoveredElement && debounceRemoval && !this.hoverRemovalTimer) {
      // Pointer left the current target – start a 0.25 s debounce before removing hover
      this.hoverRemovalTimer = setTimeout(() => {
        this.clearHoverState();
      }, 250);
    } else if (this.hoveredElement && !debounceRemoval) {
      this.clearHoverState();
    }
  }

  /** Removes the hover visual from the current target and cancels any pending timer. */
  private clearHoverState(): void {
    this.clearHoverTimer();
    if (this.hoveredElement) {
      this.hoveredElement.classList.remove('drag-hover-target');
      this.hoveredElement = null;
    }
  }

  /** Cancels the debounced hover-removal timer if one is running. */
  private clearHoverTimer(): void {
    if (this.hoverRemovalTimer) {
      clearTimeout(this.hoverRemovalTimer);
      this.hoverRemovalTimer = null;
    }
  }

  /** Called when drag ends. Swaps players if hovering another, otherwise resets position. */
  onDragEnded(event: CdkDragEnd, player: PitchRowPlayer): void {
    const pitchTargetPlayer = this.getHoveredPitchTargetPlayer();
    const rowTargetPlayer = this.getHoveredListRowTargetPlayer();

    if (pitchTargetPlayer) {
      this.onPlayerSwap(player, pitchTargetPlayer);
    } else if (rowTargetPlayer) {
      this.onPlayerSwap(player, rowTargetPlayer);
    }

    // Always reset position and clean up
    event.source.reset();
    this.draggedPosition.set(null);
    this.clearHoverState();
    this.clearListRowHoverState();
  }

  /** Called when a dragged player is dropped onto another player. */
  onPlayerSwap(draggedPlayer: PlayerSwapParticipant, targetPlayer: PlayerSwapParticipant): void {
    this.swapPlayerTactics(draggedPlayer.playerTacticID, targetPlayer.playerTacticID, 'Error swapping players:');
  }

  onTablePlayerDragStarted(): void {
    this.clearHoverState();
    this.clearListRowHoverState();
  }

  onTablePlayerDragMoved(event: CdkDragMove, player: PlayerTacticTableRow): void {
    this.updateHoveredPitchNode(event, false);
    this.updateHoveredListRow(event, player);
  }

  onTablePlayerDragEnded(event: CdkDragEnd, player: PlayerTacticTableRow): void {
    const pitchTargetPlayer = this.getHoveredPitchTargetPlayer();
    const rowTargetPlayer = this.getHoveredListRowTargetPlayer();

    if (pitchTargetPlayer) {
      this.onPlayerSwap(player, pitchTargetPlayer);
    } else if (rowTargetPlayer) {
      this.onPlayerSwap(player, rowTargetPlayer);
    }

    event.source.reset();
    this.clearHoverState();
    this.clearListRowHoverState();
  }

  /** Reloads the player tactics from the backend and updates the signal.
   *  Note: takeUntilDestroyed is safe here because this.destroyRef was captured
   *  in the constructor (injection context) and is passed explicitly. */
  private reloadPlayerTactics(): void {
    const id = this.tacticId();
    if (!id) return;
    this.tacticsService.getPlayerTactics(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pts) => {
          this.playerTactics.set(pts);
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error reloading player tactics:', err);
        }
      });
  }

  private setRoleUpdateInProgress(playerTacticID: string, isUpdating: boolean): void {
    this.updatingRoleIds.update(ids => {
      const nextIds = new Set(ids);

      if (isUpdating) {
        nextIds.add(playerTacticID);
      } else {
        nextIds.delete(playerTacticID);
      }

      return nextIds;
    });
  }

  private updatePlayerRoleInState(playerTacticID: string, playerRole: PlayerRole): void {
    this.selectedPlayer.update(selected => {
      if (!selected || selected.playerTacticID !== playerTacticID) {
        return selected;
      }

      return {
        ...selected,
        roleValue: playerRole,
        suitability: this.getPlayerSuitability(selected.person, selected.positionValue, playerRole)
      };
    });

    this.playerTactics.update(playerTactics =>
      playerTactics.map(playerTactic =>
        playerTactic.playerTacticID === playerTacticID
          ? { ...playerTactic, playerRole }
          : playerTactic
      )
    );
  }

  private replacePlayerTacticInState(updatedPlayerTactic: PlayerTactic): void {
    this.playerTactics.update(playerTactics =>
      playerTactics.map(playerTactic => {
        if (playerTactic.playerTacticID !== updatedPlayerTactic.playerTacticID) {
          return playerTactic;
        }

        return {
          ...playerTactic,
          ...updatedPlayerTactic,
          person: this.mergePlayerTacticPerson(playerTactic.person, updatedPlayerTactic.person)
        };
      })
    );
  }

  private mergePlayerTacticPerson(currentPerson: Person | undefined, updatedPerson: Person | undefined): Person | undefined {
    if (!updatedPerson) {
      return currentPerson;
    }

    if (!currentPerson) {
      return updatedPerson;
    }

    return {
      ...currentPerson,
      ...updatedPerson,
      playerTrainedPositions: updatedPerson.playerTrainedPositions ?? currentPerson.playerTrainedPositions,
      playerTrainedRoles: updatedPerson.playerTrainedRoles ?? currentPerson.playerTrainedRoles
    };
  }

  private swapPlayerTactics(
    firstPlayerTacticID: string | undefined,
    secondPlayerTacticID: string | undefined,
    errorPrefix: string,
    onSuccess?: () => void,
    onError?: () => void
  ): void {
    if (!firstPlayerTacticID || !secondPlayerTacticID || firstPlayerTacticID === secondPlayerTacticID) {
      return;
    }

    const swapKey = [firstPlayerTacticID, secondPlayerTacticID].sort().join(':');
    if (this.activeSwapKeys.has(swapKey)) {
      return;
    }

    this.activeSwapKeys.add(swapKey);
    this.error.set(null);

    this.tacticsService.swapPlayerTactics(firstPlayerTacticID, secondPlayerTacticID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.activeSwapKeys.delete(swapKey);
          onSuccess?.();
          this.reloadPlayerTactics();
        },
        error: (err) => {
          this.activeSwapKeys.delete(swapKey);
          onError?.();
          console.error(errorPrefix, err);
          this.error.set(err.message || 'Failed to swap players');
          this.cdr.markForCheck();
        }
      });
  }

  private getHoveredPitchTargetPlayer(): PitchRowPlayer | null {
    if (!this.hoveredElement) {
      return null;
    }

    const positionAttr = this.hoveredElement.getAttribute('data-position');

    if (positionAttr == null) {
      return null;
    }

    return this.findPlayerByPosition(Number(positionAttr));
  }

  private updateHoveredListRow(event: CdkDragMove, draggedPlayer: PlayerSwapParticipant): void {
    const { x, y } = event.pointerPosition;
    const dragElement = event.source.element.nativeElement;
    const allPlayerRows = this.elementRef.nativeElement.querySelectorAll('.player-list-row[data-player-tactic-id]');
    let foundTarget: HTMLElement | null = null;

    for (const row of Array.from(allPlayerRows)) {
      const rowElement = row as HTMLElement;

      if (
        rowElement === dragElement ||
        rowElement.classList.contains('cdk-drag-dragging') ||
        rowElement.getAttribute('data-player-tactic-id') === draggedPlayer.playerTacticID
      ) {
        continue;
      }

      const rect = rowElement.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        foundTarget = rowElement;
        break;
      }
    }

    if (foundTarget === this.hoveredListRowElement) {
      return;
    }

    this.clearListRowHoverState();

    if (foundTarget) {
      foundTarget.classList.add('drag-hover-row-target');
      this.hoveredListRowElement = foundTarget;
    }
  }

  private clearListRowHoverState(): void {
    if (this.hoveredListRowElement) {
      this.hoveredListRowElement.classList.remove('drag-hover-row-target');
      this.hoveredListRowElement = null;
    }
  }

  private getHoveredListRowTargetPlayer(): PlayerTacticTableRow | null {
    if (!this.hoveredListRowElement) {
      return null;
    }

    const playerTacticID = this.hoveredListRowElement.getAttribute('data-player-tactic-id');

    if (!playerTacticID) {
      return null;
    }

    return this.tableData.find(player => player.playerTacticID === playerTacticID) ?? null;
  }

  /** Finds a PitchRowPlayer by their position enum value. */
  private findPlayerByPosition(position: number): PitchRowPlayer | null {
    for (const row of this.pitchRows()) {
      const player = row.players.find(p => p.position === position);
      if (player) return player;
    }
    return null;
  }
}
