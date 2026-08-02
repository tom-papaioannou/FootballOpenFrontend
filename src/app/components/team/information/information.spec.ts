/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReplaySubject } from 'rxjs';

import { Information } from './information';
import { Team } from '../../../models/competition.model';
import { TeamsService } from '../../../services/teams.service';

describe('Information', () => {
  let component: Information;
  let fixture: ComponentFixture<Information>;
  let currentTeam$: ReplaySubject<Team>;
  const mockTeam: Team = {
    teamID: 'team-1',
    name: 'Blue Team',
    stadium: {
      name: 'Blue Arena',
      latitude: 0,
      longitude: 0,
      capacity: 25000
    },
    kit: {
      homeShirtColor: '#1f6feb',
      homeShortsColor: '#ffffff',
      awayShirtColor: '#ffffff',
      awayShortsColor: '#1f6feb'
    }
  };

  beforeEach(async () => {
    currentTeam$ = new ReplaySubject<Team>(1);
    currentTeam$.next(mockTeam);

    await TestBed.configureTestingModule({
      imports: [Information],
      providers: [{
        provide: TeamsService,
        useValue: {
          CurrentTeam: mockTeam,
          currentTeamObservable: currentTeam$.asObservable()
        }
      }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Information);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show team name', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Blue Team');
  });
});
