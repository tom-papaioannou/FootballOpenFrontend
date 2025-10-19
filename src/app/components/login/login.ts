import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCard } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { ActionButton } from '../shared/buttons/action-button/action-button';
import { FormTextfield } from '../shared/textfields/form-textfield/form-textfield';
import { LinkButton } from '../shared/buttons/link-button/link-button';
import { Authentication } from '../../services/authentication';

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

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: Authentication
  ) {
    this.loginForm = this.fb.group({
      username: [''],
      password: ['']
    });
  }

  login(){
    if(this.loginForm.value.username === "Tom"){
      localStorage.setItem("token", "user");
      this.router.navigate(['/home']);
      this.authService.emitChange();
    }
    else if(this.loginForm.value.username === "Admin"){
      localStorage.setItem("token", "admin");
      this.router.navigate(['/home']);
      this.authService.emitChange();
    }
  }
}
