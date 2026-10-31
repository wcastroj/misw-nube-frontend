import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { LoginApiResponse, LoginRequest } from '../models/auth.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser: User = {
    id: 1,
    nombre: 'Admin User',
    email: 'admin@example.com',
    role: 'admin'
  };

  const mockLoginResponse: LoginApiResponse = {
    data: {
      token: 'jwt-token-12345',
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    }
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate user, store token and user in localStorage, and update currentUser$', () => {
    const credentials: LoginRequest = { email: 'profesor@uniandes.edu.co', password: 'secretPassword' };

    service.login(credentials).subscribe(response => {
      expect(response).toEqual({
        token: mockLoginResponse.data.token,
        user: {
          id: mockLoginResponse.data.id,
          nombre: mockLoginResponse.data.name,
          email: mockLoginResponse.data.email,
          role: mockLoginResponse.data.role
        }
      });
      expect(service.getToken()).toBe('jwt-token-12345');
      expect(service.getCurrentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.getRole()).toBe('admin');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);
    req.flush(mockLoginResponse);
  });

  it('should logout, call POST /auth/logout, clear storage, and redirect to /login', () => {
    localStorage.setItem('auth_token', 'jwt-token-12345');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    service.logout().subscribe(() => {
      expect(service.getToken()).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('should clearSession synchronously and redirect to /login', () => {
    localStorage.setItem('auth_token', 'jwt-token-12345');
    localStorage.setItem('auth_user', JSON.stringify(mockUser));

    service.clearSession();

    expect(service.getToken()).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect correctly based on role', () => {
    service.redirectByRole('admin');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/dashboard']);

    service.redirectByRole('professor');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/professor/assignments']);

    service.redirectByRole('operational');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/operational/workspaces']);
  });
});
