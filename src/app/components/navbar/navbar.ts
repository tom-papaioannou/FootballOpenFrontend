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

  rights = localStorage.getItem("token");
  signedIn: boolean;

  constructor(
    private router: Router,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ){ 
    this.signedIn = this.rights ? true : false;
    this.authService.authenticationChange?.subscribe({
      next:() => {
        this.rights = localStorage.getItem("token");
        this.signedIn = this.rights ? true : false;
        this.cdr.detectChanges();
      }
    });
  }

  logOut(){
    localStorage.removeItem("token");
    this.router.navigate(['/login']);
    this.authService.emitChange();
  }
}
