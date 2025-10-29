import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authenticationChange = new EventEmitter<any>();
  loggedIn = localStorage.getItem("token") !== null;
  role = "";

  constructor(private readonly http: HttpClient) {}

  isLoggedIn() : boolean  {
    return this.loggedIn;
  }

  testConnection(): Observable<any>{
    return this.http.get(`${environment.apiUrl}/api/test/connection`);
  }

  login(data: any): Observable<any>{
    return this.http.post<{ token: string }>(`${environment.apiUrl}/api/auth/login`, data);
  }

  emitChange(){
    this.authenticationChange.emit();
  }

  afterSuccessfullLogin(result: any){
    this.role = result.role;
    this.loggedIn = true;
    localStorage.setItem('role', this.role);
    localStorage.setItem('token', result.token);
    this.emitChange();
  }

  logOut(){
    this.loggedIn = false;
    this.role = "";
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    this.emitChange();
  }
}
