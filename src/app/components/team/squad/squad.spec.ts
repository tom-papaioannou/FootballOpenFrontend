import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Squad } from './squad';

describe('Squad', () => {
  let component: Squad;
  let fixture: ComponentFixture<Squad>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Squad]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Squad);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
