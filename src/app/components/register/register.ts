/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { Kit } from '../../models/competition.model';
import { AuthService } from '../../services/auth.service';
import { RegistrationService } from '../../services/registration.service';
import {
  CompleteRegistrationRequest,
  RegistrationApiError,
  RegistrationTeam
} from '../../models/registration.model';
import { ActionButton } from '../shared/buttons/action-button/action-button';
import { Card } from '../shared/cards/card/card';
import { FormDropdown } from '../shared/dropdowns/form-dropdown/form-dropdown';
import { FormTextfield } from '../shared/textfields/form-textfield/form-textfield';
import { TeamKit } from '../team-kit/team-kit';

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'error';
type RegistrationStep = 1 | 2;

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ActionButton,
    Card,
    FormTextfield,
    FormDropdown,
    TeamKit
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Register implements OnInit {
  accountForm: FormGroup;
  teamForm: FormGroup;
  step: RegistrationStep = 1;

  serverOptions: { value: string; label: string }[] = [];
  nationOptions: { value: string; label: string }[] = [];
  teams: RegistrationTeam[] = [];
  selectedTeam: RegistrationTeam | null = null;

  loadingServers = false;
  loadingNations = false;
  loadingTeams = false;
  checkingAccountOnContinue = false;
  submitting = false;

  usernameStatus: AvailabilityState = 'idle';
  usernameMessage = '';
  emailStatus: AvailabilityState = 'idle';
  emailMessage = '';

  accountError: string | null = null;
  teamError: string | null = null;
  apiErrors: Record<string, string[]> = {};

  private readonly destroyRef = inject(DestroyRef);
  private readonly SNACKBAR_DURATION_MS = 3000;
  private usernameCheck?: Subscription;
  private emailCheck?: Subscription;
  private nationsRequest?: Subscription;
  private teamsRequest?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly registrationService: RegistrationService,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.accountForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.maxLength(50)]],
        email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
        password: ['', [Validators.required, this.passwordRulesValidator]],
        confirmPassword: ['', Validators.required],
        serverID: ['', Validators.required]
      },
      { validators: this.passwordMatchValidator }
    );

    this.teamForm = this.fb.group({
      nationID: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadJoinableServers();
    this.registerFormSubscriptions();
  }

  get passwordMismatch(): boolean {
    const confirmPassword = this.accountForm.get('confirmPassword');
    return !!(
      this.accountForm.hasError('passwordMismatch') &&
      confirmPassword?.touched &&
      confirmPassword.value
    );
  }

  get passwordRuleMessages(): string[] {
    const errors = this.accountForm.get('password')?.errors ?? {};
    const messages: string[] = [];

    if (errors['passwordMinLength']) {
      messages.push('Use at least 10 characters.');
    }

    if (errors['passwordUppercase']) {
      messages.push('Add at least one uppercase letter.');
    }

    if (errors['passwordLowercase']) {
      messages.push('Add at least one lowercase letter.');
    }

    if (errors['passwordNumber']) {
      messages.push('Add at least one number.');
    }

    if (errors['passwordSymbol']) {
      messages.push('Add at least one symbol or special character.');
    }

    return messages;
  }

  get isAccountCheckPending(): boolean {
    return (
      this.usernameStatus === 'checking' ||
      this.emailStatus === 'checking' ||
      this.checkingAccountOnContinue
    );
  }

  get canContinueAccount(): boolean {
    return (
      this.accountForm.valid &&
      !this.loadingServers &&
      !this.isAccountCheckPending &&
      this.usernameStatus !== 'taken' &&
      this.usernameStatus !== 'error' &&
      this.emailStatus !== 'taken' &&
      this.emailStatus !== 'error'
    );
  }

  get canCreateAccount(): boolean {
    return (
      this.step === 2 &&
      this.teamForm.valid &&
      !!this.selectedTeam?.isAvailable &&
      !this.loadingTeams &&
      !this.loadingNations &&
      !this.submitting
    );
  }

  get selectedServerID(): string {
    return this.accountForm.get('serverID')?.value ?? '';
  }

  get selectedNationID(): string {
    return this.teamForm.get('nationID')?.value ?? '';
  }

  get availableTeamsCount(): number {
    return this.teams.filter(team => team.isAvailable).length;
  }

  get thirdKitPreview(): Kit | null {
    const kit = this.selectedTeam?.kit as (Kit & {
      thirdShirtColor?: string | null;
      thirdShortsColor?: string | null;
    }) | null | undefined;

    if (!kit?.thirdShirtColor) {
      return null;
    }

    return {
      ...kit,
      homeShirtColor: kit.thirdShirtColor,
      homeShortsColor: kit.thirdShortsColor ?? kit.homeShortsColor
    };
  }

  passwordRulesValidator = (control: AbstractControl): ValidationErrors | null => {
    const password = control.value ?? '';
    if (!password) {
      return null;
    }

    const errors: ValidationErrors = {};

    if (password.length < 10) {
      errors['passwordMinLength'] = true;
    }

    if (!/[A-Z]/.test(password)) {
      errors['passwordUppercase'] = true;
    }

    if (!/[a-z]/.test(password)) {
      errors['passwordLowercase'] = true;
    }

    if (!/[0-9]/.test(password)) {
      errors['passwordNumber'] = true;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      errors['passwordSymbol'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };

  passwordMatchValidator = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  };

  checkUsernameAvailability(): void {
    const usernameControl = this.accountForm.get('username');
    usernameControl?.markAsTouched();
    this.clearApiError('username');

    if (!usernameControl || usernameControl.invalid) {
      this.setUsernameStatus('idle', '');
      return;
    }

    const username = usernameControl.value.trim();
    this.usernameCheck?.unsubscribe();
    this.setUsernameStatus('checking', 'Checking username...');

    this.usernameCheck = this.registrationService
      .checkUsername(username)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          if (this.accountForm.get('username')?.value.trim() !== username) {
            return;
          }
          this.setUsernameStatus(result.isAvailable ? 'available' : 'taken', result.message);
        },
        error: () => {
          this.setUsernameStatus('error', 'Could not check username availability.');
        }
      });
  }

  checkEmailAvailability(): void {
    const emailControl = this.accountForm.get('email');
    emailControl?.markAsTouched();
    this.clearApiError('email');

    if (!emailControl || emailControl.invalid) {
      this.setEmailStatus('idle', '');
      return;
    }

    const email = emailControl.value.trim();
    this.emailCheck?.unsubscribe();
    this.setEmailStatus('checking', 'Checking email...');

    this.emailCheck = this.registrationService
      .checkEmail(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          if (this.accountForm.get('email')?.value.trim() !== email) {
            return;
          }
          this.setEmailStatus(result.isAvailable ? 'available' : 'taken', result.message);
        },
        error: () => {
          this.setEmailStatus('error', 'Could not check email availability.');
        }
      });
  }

  continueToTeamStep(): void {
    this.markFormTouched(this.accountForm);
    this.accountError = null;

    if (this.accountForm.invalid || this.isAccountCheckPending) {
      return;
    }

    const username = this.accountForm.get('username')!.value.trim();
    const email = this.accountForm.get('email')!.value.trim();

    this.checkingAccountOnContinue = true;
    this.setUsernameStatus('checking', 'Checking username...');
    this.setEmailStatus('checking', 'Checking email...');

    forkJoin({
      username: this.registrationService.checkUsername(username),
      email: this.registrationService.checkEmail(email)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.checkingAccountOnContinue = false;
          this.setUsernameStatus(
            result.username.isAvailable ? 'available' : 'taken',
            result.username.message
          );
          this.setEmailStatus(
            result.email.isAvailable ? 'available' : 'taken',
            result.email.message
          );

          if (!result.username.isAvailable || !result.email.isAvailable) {
            return;
          }

          this.step = 2;
          this.loadNations();
          this.cdr.markForCheck();
        },
        error: () => {
          this.checkingAccountOnContinue = false;
          this.setUsernameStatus('error', 'Could not verify username availability.');
          this.setEmailStatus('error', 'Could not verify email availability.');
        }
      });
  }

  goBackToAccountStep(): void {
    this.step = 1;
    this.teamError = null;
  }

  selectTeam(team: RegistrationTeam): void {
    if (!team.isAvailable) {
      this.selectedTeam = null;
      this.teamError = 'This team is already managed. Please choose another team.';
      return;
    }

    this.selectedTeam = team;
    this.teamError = null;
  }

  createAccount(): void {
    this.markFormTouched(this.teamForm);
    this.teamError = null;

    if (!this.selectedTeam?.isAvailable) {
      this.teamError = 'Select an available team to continue.';
      return;
    }

    if (!this.canCreateAccount) {
      return;
    }

    const request: CompleteRegistrationRequest = {
      username: this.accountForm.get('username')!.value.trim(),
      email: this.accountForm.get('email')!.value.trim(),
      password: this.accountForm.get('password')!.value,
      confirmPassword: this.accountForm.get('confirmPassword')!.value,
      serverID: this.selectedServerID,
      nationID: this.selectedNationID,
      teamID: this.selectedTeam.teamID
    };

    this.submitting = true;
    this.cdr.markForCheck();

    this.registrationService
      .completeRegistration(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.submitting = false;
          this.authService.afterSuccessfulRegistration(result);
          this.snackBar.open('Registration complete. Welcome to your new club.', 'Close', {
            duration: this.SNACKBAR_DURATION_MS,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.router.navigate([this.authService.getDefaultAuthenticatedRoute()]);
        },
        error: error => {
          this.submitting = false;
          this.handleRegistrationError(error);
          this.cdr.markForCheck();
        }
      });
  }

  fieldApiErrors(field: string): string[] {
    return this.apiErrors[field] ?? [];
  }

  private registerFormSubscriptions(): void {
    this.accountForm
      .get('username')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.usernameCheck?.unsubscribe();
        this.setUsernameStatus('idle', '');
        this.clearApiError('username');
      });

    this.accountForm
      .get('email')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.emailCheck?.unsubscribe();
        this.setEmailStatus('idle', '');
        this.clearApiError('email');
      });

    this.accountForm
      .get('password')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clearApiError('password');
        this.clearApiError('confirmPassword');
      });

    this.accountForm
      .get('confirmPassword')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.clearApiError('confirmPassword'));

    this.accountForm
      .get('serverID')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.clearApiError('serverID');
        this.resetTeamSelection();
      });

    this.teamForm
      .get('nationID')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(nationID => {
        this.clearApiError('nationID');
        this.clearApiError('teamID');
        this.selectedTeam = null;
        this.teamError = null;
        this.teams = [];

        if (nationID) {
          this.loadTeams(nationID);
        }
      });
  }

  private loadJoinableServers(): void {
    this.loadingServers = true;
    this.accountError = null;

    this.registrationService
      .getJoinableServers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: servers => {
          this.serverOptions = servers.map(server => ({
            value: server.serverID,
            label: server.name
          }));
          this.loadingServers = false;

          if (this.serverOptions.length === 0) {
            this.accountError = 'No servers are currently open for new managers.';
          }

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingServers = false;
          this.accountError = 'Failed to load servers. Please try again later.';
          this.cdr.markForCheck();
        }
      });
  }

  private loadNations(): void {
    if (!this.selectedServerID) {
      return;
    }

    this.nationsRequest?.unsubscribe();
    this.loadingNations = true;
    this.teamError = null;
    this.nationOptions = [];
    this.resetTeamSelection(false);
    this.cdr.markForCheck();

    this.nationsRequest = this.registrationService
      .getNations(this.selectedServerID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: nations => {
          this.nationOptions = nations.map(nation => ({
            value: nation.nationID,
            label: nation.name
          }));
          this.loadingNations = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingNations = false;
          this.teamError = 'Failed to load nations for this server.';
          this.cdr.markForCheck();
        }
      });
  }

  private loadTeams(nationID: string): void {
    if (!this.selectedServerID) {
      return;
    }

    this.teamsRequest?.unsubscribe();
    this.loadingTeams = true;
    this.teamError = null;
    this.cdr.markForCheck();

    this.teamsRequest = this.registrationService
      .getRegistrationTeams(this.selectedServerID, nationID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: teams => {
          this.teams = teams;
          this.loadingTeams = false;

          if (
            this.selectedTeam &&
            !teams.some(team => team.teamID === this.selectedTeam?.teamID && team.isAvailable)
          ) {
            this.selectedTeam = null;
            this.teamError = 'This team is no longer available. Please choose another team.';
          }

          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingTeams = false;
          this.teamError = 'Failed to load teams for this nation.';
          this.cdr.markForCheck();
        }
      });
  }

  private refreshSelectedNationTeams(): void {
    if (this.selectedNationID) {
      this.loadTeams(this.selectedNationID);
    }
  }

  private resetTeamSelection(resetNation = true): void {
    this.nationsRequest?.unsubscribe();
    this.teamsRequest?.unsubscribe();
    this.nationOptions = [];
    this.teams = [];
    this.selectedTeam = null;
    this.teamError = null;

    if (resetNation) {
      this.teamForm.reset();
    }
  }

  private handleRegistrationError(error: any): void {
    const payload = (error?.error ?? {}) as RegistrationApiError;
    const code = payload.code;
    const errors = payload.errors ?? {};
    this.apiErrors = errors;

    if (code === 'TeamUnavailable') {
      this.selectedTeam = null;
      this.teamError =
        payload.message ?? 'This team was just selected by another manager. Please choose another team.';
      this.refreshSelectedNationTeams();
      return;
    }

    if (this.hasAnyError(errors, ['username', 'email', 'password', 'confirmPassword'])) {
      this.step = 1;
      this.applyAccountAvailabilityErrors(errors);
      this.accountError = payload.message ?? 'Please review your account details.';
      return;
    }

    if (this.hasAnyError(errors, ['serverID'])) {
      this.step = 1;
      this.accountError = errors['serverID']?.[0] ?? 'Please choose another server.';
      return;
    }

    if (this.hasAnyError(errors, ['nationID', 'teamID'])) {
      this.teamError =
        errors['teamID']?.[0] ??
        errors['nationID']?.[0] ??
        payload.message ??
        'Please choose another team.';
      this.refreshSelectedNationTeams();
      return;
    }

    this.teamError = payload.message ?? 'Registration failed. Please try again.';
  }

  private applyAccountAvailabilityErrors(errors: Record<string, string[]>): void {
    if (errors['username']?.length) {
      this.setUsernameStatus('taken', errors['username'][0]);
    }

    if (errors['email']?.length) {
      this.setEmailStatus('taken', errors['email'][0]);
    }
  }

  private hasAnyError(errors: Record<string, string[]>, fields: string[]): boolean {
    return fields.some(field => (errors[field]?.length ?? 0) > 0);
  }

  private markFormTouched(form: FormGroup): void {
    Object.keys(form.controls).forEach(key => form.get(key)?.markAsTouched());
  }

  private clearApiError(field: string): void {
    if (!this.apiErrors[field]) {
      return;
    }

    const { [field]: _, ...remainingErrors } = this.apiErrors;
    this.apiErrors = remainingErrors;
  }

  private setUsernameStatus(status: AvailabilityState, message: string): void {
    this.usernameStatus = status;
    this.usernameMessage = message;
    this.cdr.markForCheck();
  }

  private setEmailStatus(status: AvailabilityState, message: string): void {
    this.emailStatus = status;
    this.emailMessage = message;
    this.cdr.markForCheck();
  }
}
