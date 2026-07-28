/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldAppearance, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export type FormAutocompleteOption = Record<string, unknown>;

@Component({
  selector: 'app-form-autocomplete',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule
  ],
  templateUrl: './form-autocomplete.html',
  styleUrl: './form-autocomplete.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormAutocomplete),
      multi: true
    }
  ]
})
export class FormAutocomplete implements ControlValueAccessor, OnChanges, OnDestroy, OnInit {
  @Input() labelText = '';
  @Input() placeHolderText = '';
  @Input() appearance: MatFormFieldAppearance = 'fill';
  @Input() hintText?: string;
  @Input() options: FormAutocompleteOption[] = [];
  @Input() valueKey = 'value';
  @Input() displayKey = 'label';

  @ViewChild(MatAutocompleteTrigger) private autocompleteTrigger?: MatAutocompleteTrigger;
  @ViewChild('textInput') private textInput?: ElementRef<HTMLInputElement>;

  value: unknown = null;
  inputText = '';
  disabled = false;
  filteredOptions: FormAutocompleteOption[] = [];
  ngControl: NgControl | null = null;

  private onChange: (value: unknown) => void = () => {};
  private onTouched: () => void = () => {};
  private userIsEditing = false;
  private skipNextFocusOpen = false;
  private blurRestoreTimer?: ReturnType<typeof setTimeout>;
  private selectionVersion = 0;

  constructor(
    private readonly injector: Injector,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    try {
      this.ngControl = this.injector.get(NgControl);
    } catch {
      this.ngControl = null;
    }

    this.filterOptions();
    this.syncInputToSelectedValue();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['valueKey'] || changes['displayKey']) {
      if (!this.userIsEditing) {
        this.syncInputToSelectedValue();
      }
      this.filterOptions();
    }
  }

  ngOnDestroy(): void {
    this.clearBlurRestoreTimer();
  }

  get hasError(): boolean {
    const control = this.ngControl?.control;
    return !!(control?.invalid && (control.touched || control.dirty));
  }

  get errorMessage(): string {
    if (this.ngControl?.control?.hasError('required')) {
      return 'This field is required';
    }

    return '';
  }

  get canClear(): boolean {
    return !this.disabled && this.value !== null && this.value !== undefined;
  }

  writeValue(value: unknown): void {
    this.value = value;
    this.userIsEditing = false;
    this.syncInputToSelectedValue();
    this.filterOptions();
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    this.skipNextFocusOpen = false;
    this.userIsEditing = true;
    this.inputText = (event.target as HTMLInputElement).value;
    this.filterOptions();
    this.openPanel();
  }

  onFocus(): void {
    if (this.skipNextFocusOpen) {
      this.skipNextFocusOpen = false;
      return;
    }

    this.filterOptions();
    this.openPanel();
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    this.selectOption(event.option.value as FormAutocompleteOption);
  }

  onBlur(): void {
    this.onTouched();
    this.clearBlurRestoreTimer();

    const selectionVersionAtBlur = this.selectionVersion;
    this.blurRestoreTimer = setTimeout(() => {
      if (selectionVersionAtBlur !== this.selectionVersion) {
        return;
      }

      const exactMatch = this.findDisplayMatch(this.inputText);
      if (exactMatch) {
        this.selectOption(exactMatch);
        return;
      }

      this.syncInputToSelectedValue();
      this.userIsEditing = false;
      this.filterOptions();
    });
  }

  clearValue(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.disabled) {
      return;
    }

    this.value = null;
    this.inputText = '';
    this.userIsEditing = false;
    this.onChange(null);
    this.onTouched();
    this.filterOptions();
    this.textInput?.nativeElement.focus();
    this.openPanel();
  }

  displayOption(option: FormAutocompleteOption): string {
    const displayValue = option?.[this.displayKey];
    return displayValue === null || displayValue === undefined ? '' : String(displayValue);
  }

  trackOption(option: FormAutocompleteOption): unknown {
    return option?.[this.valueKey] ?? this.displayOption(option);
  }

  private selectOption(option: FormAutocompleteOption): void {
    this.clearBlurRestoreTimer();
    this.selectionVersion++;
    this.value = option?.[this.valueKey] ?? null;
    this.inputText = this.displayOption(option);
    this.userIsEditing = false;
    this.skipNextFocusOpen = true;
    this.onChange(this.value);
    this.onTouched();
    this.filterOptions();
    this.autocompleteTrigger?.closePanel();
  }

  private clearBlurRestoreTimer(): void {
    if (!this.blurRestoreTimer) {
      return;
    }

    clearTimeout(this.blurRestoreTimer);
    this.blurRestoreTimer = undefined;
  }

  private syncInputToSelectedValue(): void {
    const selectedOption = this.findValueMatch(this.value);
    this.inputText = selectedOption ? this.displayOption(selectedOption) : '';
  }

  private filterOptions(): void {
    const search = this.normalize(this.inputText);
    this.filteredOptions = this.options.filter(option => {
      const label = this.normalize(this.displayOption(option));
      return !search || label.includes(search);
    });
  }

  private findValueMatch(value: unknown): FormAutocompleteOption | undefined {
    return this.options.find(option => this.areEqual(option?.[this.valueKey], value));
  }

  private findDisplayMatch(displayValue: string): FormAutocompleteOption | undefined {
    const normalizedDisplayValue = this.normalize(displayValue);
    if (!normalizedDisplayValue) {
      return undefined;
    }

    return this.options.find(option => this.normalize(this.displayOption(option)) === normalizedDisplayValue);
  }

  private openPanel(): void {
    queueMicrotask(() => {
      if (!this.disabled && this.autocompleteTrigger && document.activeElement === this.textInput?.nativeElement) {
        this.cdr.detectChanges();
        this.autocompleteTrigger.updatePosition();
        this.autocompleteTrigger.openPanel();
      }
    });
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private areEqual(left: unknown, right: unknown): boolean {
    return left === right || String(left) === String(right);
  }
}
