/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { Formation } from '../models/tactic.model';
import { PlayerPosition } from '../models/player-enums.model';

export interface FormationOption {
  value: Formation;
  label: string;
}

export const FORMATION_OPTIONS: FormationOption[] = [
  { value: Formation.Four_Four_Two, label: '4-4-2' },
  { value: Formation.Four_Three_Three, label: '4-3-3' },
  { value: Formation.Three_Five_Two, label: '3-5-2' },
  { value: Formation.Five_Three_Two, label: '5-3-2' },
  { value: Formation.Four_Five_One, label: '4-5-1' },
  { value: Formation.Five_Four_One, label: '5-4-1' },
  { value: Formation.Four_Six_Zero, label: '4-6-0' },
  { value: Formation.Four_Four_Two_Diamond, label: '4-4-2-Diamond' },
  { value: Formation.Four_Four_One_One, label: '4-4-1-1' },
  { value: Formation.Four_Three_Two_One, label: '4-3-2-1' },
  { value: Formation.Four_Three_One_Two, label: '4-3-1-2' },
  { value: Formation.Four_Two_Three_One, label: '4-2-3-1' },
  { value: Formation.Four_Two_Two_Two, label: '4-2-2-2' },
  { value: Formation.Four_One_Four_One, label: '4-1-4-1' },
  { value: Formation.Four_One_Three_Two, label: '4-1-3-2' },
  { value: Formation.Four_One_Two_One_Two, label: '4-1-2-1-2' },
  { value: Formation.Three_Six_One, label: '3-6-1' },
  { value: Formation.Three_Four_Three, label: '3-4-3' },
  { value: Formation.Three_Three_Two_Two, label: '3-3-2-2' },
  { value: Formation.Three_Two_Three_Two, label: '3-2-3-2' },
  { value: Formation.Three_Four_Two_One, label: '3-4-2-1' },
  { value: Formation.Three_Four_One_Two, label: '3-4-1-2' },
  { value: Formation.Three_Three_Four, label: '3-3-4' },
  { value: Formation.Five_Two_Three, label: '5-2-3' },
  { value: Formation.Five_Three_One_One, label: '5-3-1-1' },
  { value: Formation.Two_Three_Five, label: '2-3-5' }
];

export function getFormationLabel(formation?: Formation | null): string {
  return FORMATION_OPTIONS.find(option => option.value === formation)?.label ?? '4-4-2';
}

export function getFormationPositions(formation?: Formation | null): PlayerPosition[] {
  switch (formation) {
    case Formation.Four_Three_Three:
      return [
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
      ];
    case Formation.Three_Five_Two:
      return [
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
      ];
    case Formation.Five_Three_Two:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.CentralCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
    case Formation.Four_Five_One:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.RightMidfielder,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.CentralCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.LeftMidfielder,
        PlayerPosition.CentralStriker
      ];
    case Formation.Four_Two_Three_One:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.RightDefensiveMidfielder,
        PlayerPosition.LeftDefensiveMidfielder,
        PlayerPosition.RightAttackingMidfielder,
        PlayerPosition.CentralAttackingMidfielder,
        PlayerPosition.LeftAttackingMidfielder,
        PlayerPosition.CentralStriker
      ];
    case Formation.Four_Three_Two_One:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.CentralCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.RightAttackingMidfielder,
        PlayerPosition.LeftAttackingMidfielder,
        PlayerPosition.CentralStriker
      ];
    case Formation.Four_One_Four_One:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.CentralDefensiveMidfielder,
        PlayerPosition.RightMidfielder,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.LeftMidfielder,
        PlayerPosition.CentralStriker
      ];
    case Formation.Four_Four_One_One:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.RightMidfielder,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.LeftMidfielder,
        PlayerPosition.CentralAttackingMidfielder,
        PlayerPosition.CentralStriker
      ];
    case Formation.Four_Two_Two_Two:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.RightDefensiveMidfielder,
        PlayerPosition.LeftDefensiveMidfielder,
        PlayerPosition.RightAttackingMidfielder,
        PlayerPosition.LeftAttackingMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
    case Formation.Four_Four_Two_Diamond:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.CentralDefensiveMidfielder,
        PlayerPosition.RightMidfielder,
        PlayerPosition.LeftMidfielder,
        PlayerPosition.CentralAttackingMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
    case Formation.Four_Three_One_Two:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.CentralCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.CentralAttackingMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
    case Formation.Four_One_Three_Two:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.CentralDefensiveMidfielder,
        PlayerPosition.RightMidfielder,
        PlayerPosition.CentralCenterMidfielder,
        PlayerPosition.LeftMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
    case Formation.Four_One_Two_One_Two:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.CentralDefensiveMidfielder,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.CentralAttackingMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
    case Formation.Three_Four_Three:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.RightWingBack,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.LeftWingBack,
        PlayerPosition.RightWinger,
        PlayerPosition.CentralStriker,
        PlayerPosition.LeftWinger
      ];
    case Formation.Three_Four_Two_One:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.RightWingBack,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.LeftWingBack,
        PlayerPosition.RightAttackingMidfielder,
        PlayerPosition.LeftAttackingMidfielder,
        PlayerPosition.CentralStriker
      ];
    case Formation.Three_Four_One_Two:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.RightWingBack,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.LeftWingBack,
        PlayerPosition.CentralAttackingMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
    case Formation.Three_Three_Four:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.RightDefensiveMidfielder,
        PlayerPosition.CentralDefensiveMidfielder,
        PlayerPosition.LeftDefensiveMidfielder,
        PlayerPosition.RightWinger,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker,
        PlayerPosition.LeftWinger
      ];
    case Formation.Three_Six_One:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.RightMidfielder,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.CentralCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.LeftMidfielder,
        PlayerPosition.CentralAttackingMidfielder,
        PlayerPosition.CentralStriker
      ];
    case Formation.Three_Three_Two_Two:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.RightDefensiveMidfielder,
        PlayerPosition.CentralDefensiveMidfielder,
        PlayerPosition.LeftDefensiveMidfielder,
        PlayerPosition.RightAttackingMidfielder,
        PlayerPosition.LeftAttackingMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
    case Formation.Three_Two_Three_Two:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.RightDefensiveMidfielder,
        PlayerPosition.LeftDefensiveMidfielder,
        PlayerPosition.RightAttackingMidfielder,
        PlayerPosition.CentralAttackingMidfielder,
        PlayerPosition.LeftAttackingMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
    case Formation.Five_Four_One:
      return [
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
      ];
    case Formation.Five_Two_Three:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightWingBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftWingBack,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.RightWinger,
        PlayerPosition.CentralStriker,
        PlayerPosition.LeftWinger
      ];
    case Formation.Five_Three_One_One:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightWingBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.CentralCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftWingBack,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.CentralCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.CentralAttackingMidfielder,
        PlayerPosition.CentralStriker
      ];
    case Formation.Four_Six_Zero:
      return [
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
      ];
    case Formation.Two_Three_Five:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.RightDefensiveMidfielder,
        PlayerPosition.CentralDefensiveMidfielder,
        PlayerPosition.LeftDefensiveMidfielder,
        PlayerPosition.RightWinger,
        PlayerPosition.RightStriker,
        PlayerPosition.CentralStriker,
        PlayerPosition.LeftStriker,
        PlayerPosition.LeftWinger
      ];
    case Formation.Four_Four_Two:
    default:
      return [
        PlayerPosition.Goalkeeper,
        PlayerPosition.RightBack,
        PlayerPosition.RightCenterBack,
        PlayerPosition.LeftCenterBack,
        PlayerPosition.LeftBack,
        PlayerPosition.RightMidfielder,
        PlayerPosition.RightCenterMidfielder,
        PlayerPosition.LeftCenterMidfielder,
        PlayerPosition.LeftMidfielder,
        PlayerPosition.RightStriker,
        PlayerPosition.LeftStriker
      ];
  }
}
