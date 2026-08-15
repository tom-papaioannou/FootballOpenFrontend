/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { Team } from './team';

describe('Team', () => {
  let component: Team;
  let fixture: ComponentFixture<Team>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Team],
      providers: [
        provideRouter([])
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Team);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render squad, fixtures, and staff tabs', () => {
    const tabs = fixture.debugElement.queryAll(By.css('.team-tabs a'));

    expect(tabs.length).toBe(3);
    expect(tabs[0].nativeElement.textContent.trim()).toBe('Squad');
    expect(tabs[1].nativeElement.textContent.trim()).toBe('Fixtures');
    expect(tabs[2].nativeElement.textContent.trim()).toBe('Staff');
  });
});
