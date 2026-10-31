import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';
import { By } from '@angular/platform-browser';

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title, message, and icon from inputs', () => {
    component.title = 'Sin vinculaciones';
    component.message = 'No cuentas con personas a cargo en el período activo.';
    component.iconClass = 'bi-people';
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css('.empty-state-title'));
    const messageEl = fixture.debugElement.query(By.css('.empty-state-message'));
    const iconEl = fixture.debugElement.query(By.css('i'));

    expect(titleEl.nativeElement.textContent).toContain('Sin vinculaciones');
    expect(messageEl.nativeElement.textContent).toContain('No cuentas con personas a cargo en el período activo.');
    expect(iconEl.nativeElement.className).toContain('bi-people');
  });

  it('should provide default icon if none provided', () => {
    component.title = 'Sin datos';
    component.message = 'No hay información para mostrar.';
    fixture.detectChanges();

    const iconEl = fixture.debugElement.query(By.css('i'));
    expect(iconEl).toBeTruthy();
  });
});
