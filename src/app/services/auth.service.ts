import { EventEmitter, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  authenticationChange = new EventEmitter<any>();

  isLoggedIn() : boolean  {
    return localStorage.getItem("token") !== null;
  }

  emitChange(){
    this.authenticationChange.emit();
  }
}
