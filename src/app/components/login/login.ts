import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ActionButton } from '../shared/buttons/action-button/action-button';
import { FormTextfield } from '../shared/textfields/form-textfield/form-textfield';
import { LinkButton } from '../shared/buttons/link-button/link-button';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    MatCard,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    CommonModule,
    ActionButton,
    LinkButton,
    FormTextfield
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login{
  loginForm: FormGroup;
  role = "";

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: [''],
      password: ['']
    });
  }

  login(){
    let data = {
      username: this.loginForm.value.username,
      password: this.loginForm.value.password
    };
    this.authService.login(data).subscribe({
      next: (result) => {
        this.authService.afterSuccessfullLogin(result);
        this.role = this.authService.role;
        this.router.navigate(['/home']);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }
}
