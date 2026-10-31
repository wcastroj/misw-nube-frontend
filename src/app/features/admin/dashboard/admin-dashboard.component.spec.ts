import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.model';
import { By } from '@angular/platform-browser';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockAdminUser: User = {
    id: 1,
    nombre: 'Administrador del Sistema',
    email: 'admin@uniandes.edu.co',
    role: 'admin'
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authServiceSpy.getCurrentUser.and.returnValue(mockAdminUser);

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display administrator profile and session status', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Administrador del Sistema');
    expect(compiled.textContent).toContain('admin@uniandes.edu.co');
    expect(compiled.textContent).toContain('Administrador');
    expect(compiled.textContent).toContain('Activa');
  });

  it('should strictly exclude any operational controls, academic management tables or edit buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    const tables = fixture.debugElement.queryAll(By.css('table'));
    const forms = fixture.debugElement.queryAll(By.css('form'));

    expect(buttons.length).toBe(0);
    expect(tables.length).toBe(0);
    expect(forms.length).toBe(0);
  });
});
