/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, take, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { jwtDecode } from 'jwt-decode';
import { ServerService } from './server.service';
import {
  AdminHostRegistrationRequest,
  AuthRegistrationResponse,
  CompleteRegistrationResponse
} from '../models/registration.model';

type JwtPayload = { exp?: number; role?: string; };

export interface RefreshResponse {
  token: string;
  role: string;
}

export interface CurrentUserSummary {
  username: string;
  role: string;
  serverID?: string | null;
  serverName?: string | null;
  teamID?: string | null;
  teamName?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authenticationChange = new EventEmitter<any>();
  loggedIn = sessionStorage.getItem("token") !== null;
  private tokenSubject = new BehaviorSubject<string | null>(sessionStorage.getItem('token'));
  token$ = this.tokenSubject.asObservable();
  currentServerID: string | null = sessionStorage.getItem('serverID');
  private serverSubject = new BehaviorSubject<string | null>(sessionStorage.getItem('serverID'));
  server$ = this.serverSubject.asObservable();
  private currentUserSubject = new BehaviorSubject<CurrentUserSummary | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly serverService: ServerService
  ) {}

  get token(): string | null {
    return this.tokenSubject.value;
  }

  isLoggedIn(): boolean {
    return this.hasValidAccessToken();
  }

  hasValidAccessToken(): boolean {
    const t = this.token;
    if (!t){
      return false;
    }
    return !this.isTokenExpired(t);
  }

  hasRefreshToken(): boolean {
    // The refresh token is stored as an HTTP-only cookie and cannot be read
    // directly from JavaScript. We use the presence of any access token (even
    // expired) as a heuristic: if the user previously authenticated, a refresh
    // cookie likely exists. If the cookie has since expired, the refresh call
    // will fail and the guard handles that by clearing state and redirecting.
    return this.token !== null;
  }

  refreshToken(): Observable<RefreshResponse> {
    return this.refresh();
  }

  getRole(): string {
    const t = this.token;
    if (!t) return '';
    const payload = jwtDecode<JwtPayload & Record<string, unknown>>(t);
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? payload.role;
    return typeof role === 'string' ? role : '';
  }

  getDefaultAuthenticatedRoute(): string {
    const role = this.getRole().toLowerCase();

    if (role === 'admin') {
      return '/adminpanel';
    }

    if (role === 'host' && this.currentServerID) {
      return `/server/${this.currentServerID}`;
    }

    return '/home';
  }

  getDefaultAuthenticatedRoute$(): Observable<string> {
    const role = this.getRole().toLowerCase();

    if (role === 'admin') {
      return of('/adminpanel');
    }

    if (role === 'host') {
      if (this.currentServerID) {
        return of(`/server/${this.currentServerID}`);
      }

      return this.loadUserServerID().pipe(
        map((serverID) => serverID ? `/server/${serverID}` : '/home'),
        catchError((err) => {
          console.error('Failed to resolve default authenticated route', err);
          return of('/home');
        })
      );
    }

    return of('/home');
  }

  getUserID(): string {
    const t = this.token;
    if (!t) return '';
    const payload = jwtDecode<any>(t);
    return payload['sub'] ?? '';
  }

  fetchAndStoreServerID(): void {
    this.loadUserServerID().subscribe({
      error: (err) => {
        console.error('Failed to fetch user server', err);
      }
    });
  }

  private loadUserServerID(): Observable<string | null> {
    const userID = this.getUserID();
    if (!userID) return of(null);

    return this.serverService.getUserServer(userID).pipe(
      take(1),
      tap((serverID) => {
        if (serverID) {
          this.currentServerID = serverID;
          sessionStorage.setItem('serverID', this.currentServerID);
          this.serverSubject.next(this.currentServerID);
        }
      }),
      map((serverID) => serverID || null)
    );
  }

  getCurrentUserSummary(): Observable<CurrentUserSummary> {
    return this.http.get<CurrentUserSummary>(`${environment.apiUrl}/api/auth/me`);
  }

  loadCurrentUserSummary(): void {
    if (!this.isLoggedIn()) {
      this.currentUserSubject.next(null);
      return;
    }

    this.getCurrentUserSummary().pipe(take(1)).subscribe({
      next: (summary) => {
        this.currentUserSubject.next(summary);

        if (summary.serverID) {
          this.currentServerID = summary.serverID;
          sessionStorage.setItem('serverID', summary.serverID);
          this.serverSubject.next(summary.serverID);
        }
      },
      error: (err) => {
        console.error('Failed to fetch current user summary', err);
        this.currentUserSubject.next(null);
      }
    });
  }

  private isTokenExpired(token: string): boolean {
    const payload = jwtDecode<JwtPayload>(token);
    if (!payload.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp <= now;
  }

  testConnection(): Observable<any>{
    return this.http.get(`${environment.apiUrl}/api/test/connection`);
  }

  login(username: string, password: string) {
    return this.http.post<{ token: string; role: string }>(`${environment.apiUrl}/api/auth/login`, { username, password }, { withCredentials: true }).pipe(
      tap(res => {
        this.setToken(res.token);
      })
    );
  }

  refresh(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${environment.apiUrl}/api/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap(res => this.setToken(res.token))
    );
  }

  register(data: { username: string; password: string; serverID: string }): Observable<AuthRegistrationResponse>{
    return this.http.post<AuthRegistrationResponse>(`${environment.apiUrl}/api/auth/register`, data);
  }

  registerHostByAdmin(data: AdminHostRegistrationRequest): Observable<AuthRegistrationResponse> {
    return this.http.post<AuthRegistrationResponse>(`${environment.apiUrl}/api/auth/registerByAdmin`, data);
  }

  emitChange(){
    this.authenticationChange.emit();
  }

  afterSuccessfulLogin(result: any){
    this.loggedIn = true;
    this.emitChange();
  }

  afterSuccessfulRegistration(result: CompleteRegistrationResponse): void {
    this.setToken(result.token);
    this.afterSuccessfulLogin(result);
  }

  logOut() {
    return this.http.post(`${environment.apiUrl}/api/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearToken())
    );
  }

  private setToken(token: string) {
    sessionStorage.setItem('token', token);
    this.tokenSubject.next(token);
  }

  public clearToken() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('serverID');
    this.tokenSubject.next(null);
    this.serverSubject.next(null);
    this.currentUserSubject.next(null);
    this.currentServerID = null;
    this.emitChange();
  }
}
