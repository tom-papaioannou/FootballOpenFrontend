import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTextfield } from './form-textfield';

describe('FormTextfield', () => {
  let component: FormTextfield;
  let fixture: ComponentFixture<FormTextfield>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormTextfield]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormTextfield);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
