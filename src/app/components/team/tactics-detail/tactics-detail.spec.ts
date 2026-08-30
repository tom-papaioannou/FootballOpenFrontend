/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { TacticsDetail } from './tactics-detail';
import { TacticsService } from '../../../services/tactics.service';
import { TeamsService } from '../../../services/teams.service';
import { Formation, PassingMentality, SquadUnit, Tactic, TacticMentality } from '../../../models/tactic.model';
import { PlayerPosition, PlayerRole } from '../../../models/player-enums.model';

describe('TacticsDetail', () => {
  let component: TacticsDetail;
  let fixture: ComponentFixture<TacticsDetail>;
  let tacticsService: jasmine.SpyObj<TacticsService>;
  let router: jasmine.SpyObj<Router>;

  const baseTactic: Tactic = {
    tacticID: 'test-tactic-id',
    teamID: 'team-1',
    name: 'Balanced',
    isMain: false,
    formation: Formation.Four_Four_Two
  };

  beforeEach(async () => {
    tacticsService = jasmine.createSpyObj<TacticsService>('TacticsService', [
      'getPlayerTactics',
      'swapPlayerTactics',
      'updateTeamTactic'
    ]);
    tacticsService.getPlayerTactics.and.returnValue(of([]));
    tacticsService.swapPlayerTactics.and.returnValue(of(void 0));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [TacticsDetail],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'test-tactic-id'
              }
            }
          }
        },
        {
          provide: Router,
          useValue: router
        },
        {
          provide: TacticsService,
          useValue: tacticsService
        },
        {
          provide: TeamsService,
          useValue: {
            CurrentTeam: undefined,
            currentTeamObservable: of(),
            getTeamSquad: jasmine.createSpy('getTeamSquad').and.returnValue(of([]))
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TacticsDetail);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the requested formations in the edit dropdown options', () => {
    const labels = component.formationOptions.map(option => option.label);

    expect(labels).toEqual(jasmine.arrayContaining([
      '5-4-1',
      '4-6-0',
      '4-4-2-Diamond',
      '4-4-1-1',
      '4-3-2-1',
      '4-3-1-2',
      '4-2-3-1',
      '4-2-2-2',
      '4-1-4-1',
      '4-1-3-2',
      '4-1-2-1-2',
      '3-6-1',
      '3-4-3',
      '3-3-2-2',
      '3-2-3-2'
    ]));
  });

  it('should sort formation dropdown options by label', () => {
    const labels = component.formationOptions.map(option => option.label);
    const sortedLabels = [...labels].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    expect(labels).toEqual(sortedLabels);
  });

  it('should keep RM and LM wide when they are the only players in a pitch row', () => {
    const rowClass = component.getRowClasses({
      rowIndex: 3,
      isGoalkeeper: false,
      players: [{
        position: PlayerPosition.LeftMidfielder,
        positionLabel: 'LM',
        playerName: 'L. Midfielder',
        displayNumber: 16,
        role: PlayerRole.WideMidfielder
      }, {
        position: PlayerPosition.RightMidfielder,
        positionLabel: 'RM',
        playerName: 'R. Midfielder',
        displayNumber: 12,
        role: PlayerRole.WideMidfielder
      }]
    });

    expect(rowClass).toBe('justify-between');
  });

  it('should keep central two-player rows compact', () => {
    const rowClass = component.getRowClasses({
      rowIndex: 5,
      isGoalkeeper: false,
      players: [{
        position: PlayerPosition.LeftStriker,
        positionLabel: 'LST',
        playerName: 'L. Striker',
        displayNumber: 24,
        role: PlayerRole.AdvancedForward
      }, {
        position: PlayerPosition.RightStriker,
        positionLabel: 'RST',
        playerName: 'R. Striker',
        displayNumber: 22,
        role: PlayerRole.AdvancedForward
      }]
    });

    expect(rowClass).toBe('justify-center gap-10');
  });

  it('should preserve empty tactical row bands so positions keep consistent heights', () => {
    component.playerTactics.set([
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
    ].map((playerPosition, index) => ({
      playerTacticID: `player-tactic-${index}`,
      tacticID: baseTactic.tacticID!,
      playerPosition,
      playerRole: playerPosition === PlayerPosition.Goalkeeper
        ? PlayerRole.Goalkeeper
        : PlayerRole.AdvancedForward,
      squadUnit: SquadUnit.Starting
    })));

    const rows = component.pitchRows();

    expect(rows.map(row => row.rowIndex)).toEqual([5, 4, 3, 2, 1, 0]);
    expect(rows.find(row => row.rowIndex === 3)?.players).toEqual([]);
    expect(rows.find(row => row.rowIndex === 2)?.players.map(player => player.position))
      .toEqual([PlayerPosition.LeftDefensiveMidfielder, PlayerPosition.RightDefensiveMidfielder]);
    expect(component.getPitchRowTop(rows.find(row => row.rowIndex === 2)!)).toBe(62);
    expect(component.getPitchRowTop(rows.find(row => row.rowIndex === 1)!)).toBe(76.5);
    expect(component.getPitchRowTop(rows.find(row => row.rowIndex === 3)!)).toBe(50);
    expect(component.getPitchRowTop(rows.find(row => row.rowIndex === 4)!)).toBe(34);
  });

  it('should reload tactic details after a formation change', () => {
    tacticsService.updateTeamTactic.and.returnValue(of({
      ...baseTactic,
      formation: Formation.Four_Three_Three
    }));

    component.tactic.set(baseTactic);
    component.tacticId.set(baseTactic.tacticID!);
    component.selectedPlayer.set({
      playerName: 'J. Doe',
      position: 'GK',
      positionValue: PlayerPosition.Goalkeeper,
      roleValue: PlayerRole.Goalkeeper,
      suitability: 90,
      bestTrainedPosition: 'GK',
      bestTrainedRole: 'GK',
      playerTacticID: 'player-tactic-1',
      squadUnit: 0,
      substituteOrder: Number.MAX_SAFE_INTEGER
    });
    component.editModel.set({
      name: 'Balanced',
      isMain: false,
      formation: Formation.Four_Three_Three,
      tacticMentality: TacticMentality.Balanced,
      passingMentality: PassingMentality.Balanced,
      attackLeft: true,
      attackMiddle: true,
      attackRight: true,
      earlyCrosses: false,
      offsideTrap: false
    });

    spyOn(component, 'loadTacticDetails');

    component.saveTacticEdit();

    expect(component.loadTacticDetails).toHaveBeenCalledOnceWith(baseTactic.tacticID!);
    expect(component.selectedPlayer()).toBeNull();
    expect(component.editSaving()).toBeFalse();
  });

  it('should update tactic locally when the formation is unchanged', () => {
    const updatedTactic: Tactic = {
      ...baseTactic,
      name: 'Control'
    };

    tacticsService.updateTeamTactic.and.returnValue(of(updatedTactic));

    component.tactic.set(baseTactic);
    component.tacticId.set(baseTactic.tacticID!);
    component.editModel.set({
      name: updatedTactic.name,
      isMain: updatedTactic.isMain,
      formation: updatedTactic.formation!,
      tacticMentality: updatedTactic.tacticMentality ?? TacticMentality.Balanced,
      passingMentality: updatedTactic.passingMentality ?? PassingMentality.Balanced,
      attackLeft: true,
      attackMiddle: true,
      attackRight: true,
      earlyCrosses: false,
      offsideTrap: false
    });

    spyOn(component, 'loadTacticDetails');

    component.saveTacticEdit();

    expect(component.loadTacticDetails).not.toHaveBeenCalled();
    expect(component.tactic()).toEqual(updatedTactic);
  });

  it('should keep at least one attack direction selected', () => {
    component.editModel.set({
      name: 'Balanced',
      isMain: false,
      formation: Formation.Four_Four_Two,
      tacticMentality: TacticMentality.Balanced,
      passingMentality: PassingMentality.Balanced,
      attackLeft: true,
      attackMiddle: false,
      attackRight: false,
      earlyCrosses: false,
      offsideTrap: false
    });

    component.onAttackDirectionChange('attackLeft', false);

    expect(component.editModel().attackLeft).toBeTrue();
  });

  it('should toggle use options', () => {
    component.editModel.set({
      name: 'Balanced',
      isMain: false,
      formation: Formation.Four_Four_Two,
      tacticMentality: TacticMentality.Balanced,
      passingMentality: PassingMentality.Balanced,
      attackLeft: true,
      attackMiddle: true,
      attackRight: true,
      earlyCrosses: false,
      offsideTrap: false
    });

    component.toggleTacticOption('earlyCrosses');

    expect(component.editModel().earlyCrosses).toBeTrue();
  });

  it('should group the BP value without changing the POS value', () => {
    component.playerTactics.set([{
      playerTacticID: 'midfielder-tactic',
      tacticID: baseTactic.tacticID!,
      playerPosition: PlayerPosition.LeftCenterMidfielder,
      playerRole: PlayerRole.CentralMidfielder,
      squadUnit: SquadUnit.Starting,
      person: {
        personID: 'midfielder',
        name: 'Test',
        surname: 'Midfielder',
        playerTrainedPositions: [{
          playerPosition: PlayerPosition.RightCenterMidfielder,
          playerTrainedPositionAdaptation: 90
        }],
        playerTrainedRoles: [{
          playerPosition: PlayerPosition.RightCenterMidfielder,
          playerRole: PlayerRole.CentralMidfielder,
          playerTrainedRoleAdaptation: 80
        }]
      }
    }]);

    const player = component.mainTableData[0];

    expect(player.position).toBe('LCM');
    expect(player.bestTrainedPosition).toBe('CM');
  });

  it('should navigate to the selected player profile', () => {
    const player = {
      playerName: 'J. Doe',
      position: 'GK',
      positionValue: PlayerPosition.Goalkeeper,
      roleValue: PlayerRole.Goalkeeper,
      suitability: 90,
      bestTrainedPosition: 'GK',
      bestTrainedRole: 'GK',
      playerTacticID: 'player-tactic-1',
      squadUnit: SquadUnit.Starting,
      substituteOrder: Number.MAX_SAFE_INTEGER,
      person: {
        personID: 'person-1',
        name: 'John',
        surname: 'Doe'
      }
    };

    component.selectedPlayer.set(player);

    component.viewPlayerProfile(player);

    expect(component.selectedPlayer()).toBeNull();
    expect(router.navigate).toHaveBeenCalledOnceWith(['/player', 'person-1']);
  });

  it('should navigate to a pitch player profile', () => {
    component.viewPitchPlayerProfile({
      position: PlayerPosition.Goalkeeper,
      positionLabel: 'GK',
      playerName: 'J. Doe',
      displayNumber: 1,
      playerTacticID: 'player-tactic-1',
      personID: 'person-1',
      role: PlayerRole.Goalkeeper
    });

    expect(router.navigate).toHaveBeenCalledOnceWith(['/player', 'person-1']);
  });

  it('should swap a list player with the hovered pitch player when list drag ends', () => {
    component.tacticId.set(baseTactic.tacticID!);
    component.playerTactics.set([{
      playerTacticID: 'gk-tactic',
      tacticID: baseTactic.tacticID!,
      playerPosition: PlayerPosition.Goalkeeper,
      playerRole: PlayerRole.Goalkeeper,
      squadUnit: SquadUnit.Starting,
      person: {
        personID: 'gk',
        name: 'Test',
        surname: 'Goalkeeper'
      }
    }]);

    const hoveredNode = document.createElement('div');
    hoveredNode.setAttribute('data-position', String(PlayerPosition.Goalkeeper));
    (component as unknown as { hoveredElement: HTMLElement | null }).hoveredElement = hoveredNode;

    const reset = jasmine.createSpy('reset');

    component.onTablePlayerDragEnded({
      source: { reset }
    } as never, {
      playerName: 'S. Player',
      position: 'S1',
      positionValue: PlayerPosition.CentralStriker,
      roleValue: PlayerRole.AdvancedForward,
      suitability: 70,
      bestTrainedPosition: 'ST',
      bestTrainedRole: 'AF',
      playerTacticID: 'sub-tactic',
      squadUnit: SquadUnit.Substitute,
      substituteOrder: 1
    });

    expect(tacticsService.swapPlayerTactics).toHaveBeenCalledOnceWith('sub-tactic', 'gk-tactic');
    expect(reset).toHaveBeenCalled();
  });

  it('should swap a list player with the hovered list row when list drag ends', () => {
    component.tacticId.set(baseTactic.tacticID!);
    component.playerTactics.set([{
      playerTacticID: 'first-tactic',
      tacticID: baseTactic.tacticID!,
      playerPosition: PlayerPosition.CentralStriker,
      playerRole: PlayerRole.AdvancedForward,
      squadUnit: SquadUnit.Substitute,
      substituteOrder: 1,
      person: {
        personID: 'first',
        name: 'First',
        surname: 'Player'
      }
    }, {
      playerTacticID: 'second-tactic',
      tacticID: baseTactic.tacticID!,
      playerPosition: PlayerPosition.Goalkeeper,
      playerRole: PlayerRole.Goalkeeper,
      squadUnit: SquadUnit.Substitute,
      substituteOrder: 2,
      person: {
        personID: 'second',
        name: 'Second',
        surname: 'Player'
      }
    }]);

    const hoveredRow = document.createElement('div');
    hoveredRow.setAttribute('data-player-tactic-id', 'second-tactic');
    (component as unknown as { hoveredListRowElement: HTMLElement | null }).hoveredListRowElement = hoveredRow;

    const reset = jasmine.createSpy('reset');

    component.onTablePlayerDragEnded({
      source: { reset }
    } as never, component.mainTableData[0]);

    expect(tacticsService.swapPlayerTactics).toHaveBeenCalledOnceWith('first-tactic', 'second-tactic');
    expect(reset).toHaveBeenCalled();
  });

  it('should swap a pitch player with the hovered list row when pitch drag ends', () => {
    component.tacticId.set(baseTactic.tacticID!);
    component.playerTactics.set([{
      playerTacticID: 'pitch-tactic',
      tacticID: baseTactic.tacticID!,
      playerPosition: PlayerPosition.Goalkeeper,
      playerRole: PlayerRole.Goalkeeper,
      squadUnit: SquadUnit.Starting,
      person: {
        personID: 'pitch',
        name: 'Pitch',
        surname: 'Player'
      }
    }, {
      playerTacticID: 'row-tactic',
      tacticID: baseTactic.tacticID!,
      playerPosition: PlayerPosition.CentralStriker,
      playerRole: PlayerRole.AdvancedForward,
      squadUnit: SquadUnit.Substitute,
      substituteOrder: 1,
      person: {
        personID: 'row',
        name: 'Row',
        surname: 'Player'
      }
    }]);

    const hoveredRow = document.createElement('div');
    hoveredRow.setAttribute('data-player-tactic-id', 'row-tactic');
    (component as unknown as { hoveredListRowElement: HTMLElement | null }).hoveredListRowElement = hoveredRow;

    const reset = jasmine.createSpy('reset');

    component.onDragEnded({
      source: { reset }
    } as never, {
      position: PlayerPosition.Goalkeeper,
      positionLabel: 'GK',
      playerName: 'P. Player',
      displayNumber: 1,
      playerTacticID: 'pitch-tactic',
      role: PlayerRole.Goalkeeper
    });

    expect(tacticsService.swapPlayerTactics).toHaveBeenCalledOnceWith('pitch-tactic', 'row-tactic');
    expect(reset).toHaveBeenCalled();
    expect(component.draggedPosition()).toBeNull();
  });

  it('should not call the swap endpoint when dropping a player on itself', () => {
    tacticsService.swapPlayerTactics.calls.reset();

    component.onPlayerSwap({ playerTacticID: 'same-player' }, { playerTacticID: 'same-player' });

    expect(tacticsService.swapPlayerTactics).not.toHaveBeenCalled();
  });
});
