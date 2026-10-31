import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { By } from '@angular/platform-browser';
import { LoginResponse } from '../../../core/models/auth.model';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockLoginResponse: LoginResponse = {
    token: 'jwt-token-12345',
    user: {
      id: 1,
      nombre: 'Administrador Demo',
      email: 'admin@uniandes.edu.co',
      role: 'admin'
    }
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'redirectByRole']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize login form with empty email and password and be invalid', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.valid).toBeFalse();
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
  });

  it('should mark fields as touched and prevent submission if form is invalid', () => {
    component.onSubmit();
    fixture.detectChanges();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.loginForm.get('email')?.touched).toBeTrue();
    expect(component.loginForm.get('password')?.touched).toBeTrue();
  });

  it('should submit valid credentials, invoke authService.login, and call redirectByRole on success', () => {
    authServiceSpy.login.and.returnValue(of(mockLoginResponse));

    component.loginForm.setValue({
      email: 'admin@uniandes.edu.co',
      password: 'validPassword123'
    });

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith({
      email: 'admin@uniandes.edu.co',
      password: 'validPassword123'
    });
    expect(authServiceSpy.redirectByRole).toHaveBeenCalledWith('admin');
  });

  it('should stay on the page when login fails (handled by error interceptor)', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('401 Unauthorized')));

    component.loginForm.setValue({
      email: 'admin@uniandes.edu.co',
      password: 'wrongPassword'
    });

    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalled();
    expect(authServiceSpy.redirectByRole).not.toHaveBeenCalled();
  });
});
