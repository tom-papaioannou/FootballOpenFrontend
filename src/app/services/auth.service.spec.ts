/*
 * Copyright (c) 2026 Tom Papaioannou. All rights reserved.
 * Licensed under the MIT License
 */

import { TestBed } from '@angular/core/testing';
import { AuthService, RefreshResponse } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../environments/environment.development';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getRole', () => {
    it('should return empty string when no token exists', () => {
      const role = service.getRole();
      expect(role).toBe('');
    });

    it('should extract role from JWT token', () => {
      // Create a mock JWT token with role "admin"
      // Header: {"alg":"HS256","typ":"JWT"}
      // Payload: {"role":"admin","exp":9999999999}
      // This is a dummy token for testing purposes only
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.placeholder';
      
      sessionStorage.setItem('token', mockToken);
      service = TestBed.inject(AuthService); // Reinitialize to pick up the token
      
      const role = service.getRole();
      expect(role).toBe('admin');
    });

    it('should extract role "user" from JWT token', () => {
      // Create a mock JWT token with role "user"
      // Payload: {"role":"user","exp":9999999999}
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoidXNlciIsImV4cCI6OTk5OTk5OTk5OX0.placeholder';
      
      sessionStorage.setItem('token', mockToken);
      service = TestBed.inject(AuthService);
      
      const role = service.getRole();
      expect(role).toBe('user');
    });

    it('should return empty string when role is not in token', () => {
      // Create a mock JWT token without role
      // Payload: {"exp":9999999999}
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.placeholder';
      
      sessionStorage.setItem('token', mockToken);
      service = TestBed.inject(AuthService);
      
      const role = service.getRole();
      expect(role).toBe('');
    });
  });

  describe('getDefaultAuthenticatedRoute', () => {
    it('should send admins to the admin panel', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiQWRtaW4iLCJleHAiOjk5OTk5OTk5OTl9.placeholder';

      sessionStorage.setItem('token', mockToken);
      service = TestBed.inject(AuthService);

      expect(service.getDefaultAuthenticatedRoute()).toBe('/adminpanel');
    });

    it('should send hosts with a cached server ID to their server page', () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiSG9zdCIsImV4cCI6OTk5OTk5OTk5OX0.placeholder';

      service.refreshToken().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      req.flush({ token: mockToken, role: 'Host' });
      service.currentServerID = 'server-id-456';

      expect(service.getDefaultAuthenticatedRoute()).toBe('/server/server-id-456');
    });

    it('should send other roles to home', () => {
      expect(service.getDefaultAuthenticatedRoute()).toBe('/home');
    });
  });

  describe('getDefaultAuthenticatedRoute$', () => {
    it('should fetch a host server ID before routing to the server page', (done) => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiSG9zdCIsInN1YiI6InVzZXItYWJjIiwiZXhwIjo5OTk5OTk5OTk5fQ.placeholder';

      service.refreshToken().subscribe();
      const refreshReq = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      refreshReq.flush({ token: mockToken, role: 'Host' });

      service.getDefaultAuthenticatedRoute$().subscribe((route) => {
        expect(route).toBe('/server/server-id-456');
        expect(service.currentServerID).toBe('server-id-456');
        done();
      });

      const serverReq = httpMock.expectOne(`${environment.apiUrl}/api/Servers/getUserServer/user-abc`);
      expect(serverReq.request.method).toBe('GET');
      serverReq.flush('server-id-456');
    });
  });

  describe('afterSuccessfulLogin', () => {
    it('should not store role in sessionStorage', () => {
      const result = { role: 'admin', token: 'some-token' };
      
      service.afterSuccessfulLogin(result);
      
      expect(sessionStorage.getItem('role')).toBeNull();
    });

    it('should set loggedIn to true', () => {
      const result = { role: 'admin', token: 'some-token' };
      
      service.afterSuccessfulLogin(result);
      
      expect(service.loggedIn).toBe(true);
    });

    it('should emit authentication change', (done) => {
      const result = { role: 'admin', token: 'some-token' };
      
      service.authenticationChange.subscribe(() => {
        done();
      });
      
      service.afterSuccessfulLogin(result);
    });
  });

  describe('getUserID', () => {
    it('should return empty string when no token exists', () => {
      const userID = service.getUserID();
      expect(userID).toBe('');
    });

    it('should extract user ID from JWT sub claim', () => {
      // Payload: {"sub":"test-user-id-123","exp":9999999999}
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQtMTIzIiwiZXhwIjo5OTk5OTk5OTk5fQ.placeholder';

      sessionStorage.setItem('token', mockToken);
      service = TestBed.inject(AuthService);

      const userID = service.getUserID();
      expect(userID).toBe('test-user-id-123');
    });

    it('should return empty string when sub is not in token', () => {
      // Payload: {"exp":9999999999}
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.placeholder';

      sessionStorage.setItem('token', mockToken);
      service = TestBed.inject(AuthService);

      const userID = service.getUserID();
      expect(userID).toBe('');
    });
  });

  describe('clearToken', () => {
    it('should remove token from sessionStorage', () => {
      sessionStorage.setItem('token', 'some-token');
      
      service.clearToken();
      
      expect(sessionStorage.getItem('token')).toBeNull();
    });

    it('should remove serverID from sessionStorage', () => {
      sessionStorage.setItem('token', 'some-token');
      sessionStorage.setItem('serverID', 'server-123');
      
      service.clearToken();
      
      expect(sessionStorage.getItem('serverID')).toBeNull();
    });

    it('should emit authentication change', (done) => {
      service.authenticationChange.subscribe(() => {
        done();
      });
      
      service.clearToken();
    });
  });

  describe('fetchAndStoreServerID', () => {
    it('should not make HTTP call when no token exists', () => {
      service.fetchAndStoreServerID();
      httpMock.expectNone((req) => req.url.includes('getUserServer'));
      expect(service.currentServerID).toBeNull();
    });

    it('should fetch and store server ID for logged-in user', () => {
      // Payload: {"sub":"user-abc","exp":9999999999}
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWFiYyIsImV4cCI6OTk5OTk5OTk5OX0.placeholder';
      sessionStorage.setItem('token', mockToken);
      service = TestBed.inject(AuthService);

      service.fetchAndStoreServerID();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/Servers/getUserServer/user-abc`);
      expect(req.request.method).toBe('GET');
      req.flush('server-id-456');

      expect(service.currentServerID).toBe('server-id-456');
    });
  });

  describe('hasValidAccessToken', () => {
    it('should return false when no token exists', () => {
      expect(service.hasValidAccessToken()).toBe(false);
    });

    it('should return true when token exists and is not expired', () => {
      // Payload: {"exp":9999999999}
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.placeholder';

      service.refreshToken().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      req.flush({ token: validToken, role: 'user' });

      expect(service.hasValidAccessToken()).toBe(true);
    });

    it('should return false when token is expired', () => {
      // Payload: {"exp":1000000000} (expired in 2001)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEwMDAwMDAwMDB9.placeholder';

      service.refreshToken().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      req.flush({ token: expiredToken, role: 'user' });

      expect(service.hasValidAccessToken()).toBe(false);
    });
  });

  describe('hasRefreshToken', () => {
    it('should return false when no token exists', () => {
      expect(service.hasRefreshToken()).toBe(false);
    });

    it('should return true when a token exists (even if expired)', () => {
      // Payload: {"exp":1000000000} (expired)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjEwMDAwMDAwMDB9.placeholder';

      service.refreshToken().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      req.flush({ token: expiredToken, role: 'user' });

      expect(service.hasRefreshToken()).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('should call refresh endpoint and update stored token', () => {
      const mockResponse: RefreshResponse = { token: 'new-jwt-token', role: 'user' };

      service.refreshToken().subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);

      expect(sessionStorage.getItem('token')).toBe('new-jwt-token');
    });
  });
});
