/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { Formation } from '../models/tactic.model';
import { PlayerPosition } from '../models/player-enums.model';
import { getFormationPositions } from './formation-utils';

describe('formation utils', () => {
  it('should place 4-3-3 with three central midfielders and three strikers', () => {
    expect(getFormationPositions(Formation.Four_Three_Three)).toEqual([
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
    ]);
  });

  it('should place 3-5-2 with RM and LM instead of wingbacks', () => {
    expect(getFormationPositions(Formation.Three_Five_Two)).toEqual([
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
    ]);
  });

  it('should place 5-4-1 with full backs instead of wingbacks', () => {
    expect(getFormationPositions(Formation.Five_Four_One)).toEqual([
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
    ]);
  });

  it('should place 4-6-0 with two DMs, two wingers, and two AMs', () => {
    expect(getFormationPositions(Formation.Four_Six_Zero)).toEqual([
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
    ]);
  });
});
