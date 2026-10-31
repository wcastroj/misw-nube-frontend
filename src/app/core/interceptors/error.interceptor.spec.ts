import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

describe('ErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    toastrSpy = jasmine.createSpyObj('ToastrService', ['error']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['clearSession']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastrService, useValue: toastrSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should handle 401 on login endpoint without clearSession', () => {
    httpClient.post('/api/v1/auth/login', {}).subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.clearSession).not.toHaveBeenCalled();
    expect(toastrSpy.error).toHaveBeenCalled();
  });

  it('should handle 401 on protected endpoint by clearing session and showing expired session message', () => {
    httpClient.get('/api/v1/assignments').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/v1/assignments');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.clearSession).toHaveBeenCalled();
    expect(toastrSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/sesión ha expirado/i),
      jasmine.any(String),
      jasmine.any(Object)
    );
  });

  it('should handle 403 Forbidden with permission toastr error', () => {
    httpClient.get('/api/v1/admin/workspaces').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/v1/admin/workspaces');
    req.flush({}, { status: 403, statusText: 'Forbidden' });

    expect(toastrSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/permisos/i),
      jasmine.any(String),
      jasmine.any(Object)
    );
  });

  it('should handle 404 Not Found', () => {
    httpClient.get('/api/v1/workspaces/999').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/v1/workspaces/999');
    req.flush({}, { status: 404, statusText: 'Not Found' });

    expect(toastrSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/no fue encontrado/i),
      jasmine.any(String),
      jasmine.any(Object)
    );
  });

  it('should handle 400 Bad Request with custom message', () => {
    httpClient.post('/api/v1/tasks', {}).subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/v1/tasks');
    req.flush({ message: 'Horas inválidas' }, { status: 400, statusText: 'Bad Request' });

    expect(toastrSpy.error).toHaveBeenCalledWith(
      'Horas inválidas',
      jasmine.any(String),
      jasmine.any(Object)
    );
  });

  it('should handle 500 server error and status 0 network error', () => {
    httpClient.get('/api/v1/reports').subscribe({
      error: () => {}
    });

    const req = httpMock.expectOne('/api/v1/reports');
    req.flush({}, { status: 500, statusText: 'Server Error' });

    expect(toastrSpy.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/servidor/i),
      jasmine.any(String),
      jasmine.any(Object)
    );
  });
});
