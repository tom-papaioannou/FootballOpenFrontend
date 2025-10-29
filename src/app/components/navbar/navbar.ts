import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {

  role = localStorage.getItem("role");
  loggedIn: boolean;

  constructor(
    private router: Router,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ){
    this.loggedIn = this.authService.isLoggedIn();
    this.authService.authenticationChange?.subscribe({
      next:() => {
        this.role = localStorage.getItem("role");
        this.loggedIn = this.authService.isLoggedIn();
        this.cdr.detectChanges();
      }
    });
  }

  testConnection(){
    this.authService.testConnection().subscribe({
      next: (result) => {
        debugger;
      },
      error: (error) => {
        debugger
      }
    });
  }

  logOut(){
    this.authService.logOut();
    this.router.navigate(['/login']);
  }
}
