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

  it('should reload tactic details after a formation change', () => {
    tacticsService.updateTeamTactic.and.returnValue(of({
      ...baseTactic,
      formation: Formation.Four_Three_Three
    }));

    component.tactic.set(baseTactic);
    component.tacticId.set(baseTactic.tacticID!);
    component.editPopupOpen.set(true);
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
      passingMentality: PassingMentality.Balanced
    });

    spyOn(component, 'loadTacticDetails');

    component.saveTacticEdit();

    expect(component.loadTacticDetails).toHaveBeenCalledOnceWith(baseTactic.tacticID!);
    expect(component.selectedPlayer()).toBeNull();
    expect(component.editPopupOpen()).toBeFalse();
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
      passingMentality: updatedTactic.passingMentality ?? PassingMentality.Balanced
    });

    spyOn(component, 'loadTacticDetails');

    component.saveTacticEdit();

    expect(component.loadTacticDetails).not.toHaveBeenCalled();
    expect(component.tactic()).toEqual(updatedTactic);
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
