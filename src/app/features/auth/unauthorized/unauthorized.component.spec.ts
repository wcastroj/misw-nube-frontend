import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UnauthorizedComponent } from './unauthorized.component';
import { AuthService } from '../../../core/services/auth.service';
import { By } from '@angular/platform-browser';

describe('UnauthorizedComponent', () => {
  let component: UnauthorizedComponent;
  let fixture: ComponentFixture<UnauthorizedComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['redirectByRole']);

    await TestBed.configureTestingModule({
      imports: [UnauthorizedComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display unauthorized access message', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Acceso No Autorizado');
    expect(compiled.textContent).toContain('No dispones de los permisos requeridos para ingresar a esta sección.');
  });

  it('should call authService.redirectByRole when clicking return button', () => {
    const returnBtn = fixture.debugElement.query(By.css('.btn-return'));
    expect(returnBtn).toBeTruthy();

    returnBtn.triggerEventHandler('click', null);

    expect(authServiceSpy.redirectByRole).toHaveBeenCalled();
  });
});
