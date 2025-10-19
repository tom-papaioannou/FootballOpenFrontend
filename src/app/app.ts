import { ChangeDetectionStrategy, ChangeDetectorRef, Component, signal } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavbarComponent } from './components/navbar/navbar';
import { Authentication } from './services/authentication';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  protected readonly title = signal('FootballOpenFrontend');

  rights = localStorage.getItem("token");
  signedIn: boolean;

  constructor(private readonly authService: Authentication, private readonly cdr: ChangeDetectorRef) {
    this.signedIn = this.rights ? true : false;

    this.authService.authenticationChange?.subscribe({
      next:() => {
        this.rights = localStorage.getItem("token");
        this.signedIn = this.rights ? true : false;
        this.cdr.detectChanges();
      }
    });
  }
}
