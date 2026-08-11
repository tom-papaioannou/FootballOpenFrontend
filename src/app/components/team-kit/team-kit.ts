/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Kit, KitShape } from '../../models/competition.model';

@Component({
  selector: 'app-team-kit',
  imports: [
    CommonModule
  ],
  templateUrl: './team-kit.html',
  styleUrl: './team-kit.css',
  standalone: true
})
export class TeamKit {
  @Input() kit?: Kit | null;
  @Input() isHome: boolean = true;

  get patternClass(): string | null {
    const kitShape = this.normalizedKitShape;

    switch (kitShape) {
      case KitShape.StripedFiveLines:
        return 'shirt-pattern-striped-five';
      case KitShape.StripedSevenLines:
        return 'shirt-pattern-striped-seven';
      case KitShape.DiagonalStripe:
        return 'shirt-pattern-diagonal';
      case KitShape.HalfAndHalf:
        return 'shirt-pattern-half';
      default:
        return null;
    }
  }

  private get normalizedKitShape(): KitShape {
    const kitShape = this.kit?.kitShape;

    if (typeof kitShape === 'number') {
      return kitShape;
    }

    if (typeof kitShape !== 'string') {
      return KitShape.Empty;
    }

    switch (kitShape.toLowerCase()) {
      case '1':
      case 'stripedfivelines':
        return KitShape.StripedFiveLines;
      case '2':
      case 'stripedsevenlines':
        return KitShape.StripedSevenLines;
      case '3':
      case 'diagonalstripe':
        return KitShape.DiagonalStripe;
      case '4':
      case 'halfandhalf':
        return KitShape.HalfAndHalf;
      default:
        return KitShape.Empty;
    }
  }
}
