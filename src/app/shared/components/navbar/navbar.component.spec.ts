import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { of, BehaviorSubject } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { By } from '@angular/platform-browser';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockUser: User = {
    id: 1,
    nombre: 'Profesor Carlos',
    email: 'carlos@uniandes.edu.co',
    role: 'professor'
  };

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(mockUser);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: currentUserSubject.asObservable()
    });
    authServiceSpy.logout.and.returnValue(of(undefined));
    toastrSpy = jasmine.createSpyObj('ToastrService', ['info']);

    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display user name and translated role', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Profesor Carlos');
    expect(compiled.textContent).toContain('Docente');
  });

  it('should translate roles properly to Spanish', () => {
    expect(component.getRoleLabel('admin')).toBe('Administrador');
    expect(component.getRoleLabel('professor')).toBe('Docente');
    expect(component.getRoleLabel('operational')).toBe('Monitor / Asistente');
    expect(component.getRoleLabel(undefined)).toBe('');
  });

  it('should call authService.logout and display toastr.info when logout button is clicked', () => {
    const logoutBtn = fixture.debugElement.query(By.css('.btn-logout'));
    expect(logoutBtn).toBeTruthy();

    logoutBtn.triggerEventHandler('click', null);

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(toastrSpy.info).toHaveBeenCalledWith('Has cerrado sesión correctamente.');
  });

  it('should not render navbar if no user is authenticated', () => {
    currentUserSubject.next(null);
    fixture.detectChanges();

    const nav = fixture.debugElement.query(By.css('nav'));
    expect(nav).toBeNull();
  });
});
