import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ProfessorWeeklyDetailComponent } from './professor-weekly-detail.component';
import { AssignmentService } from '../../../core/services/assignment.service';
import { WeeklyWorkDetail } from '../../../core/models/assignment.model';
import { By } from '@angular/platform-browser';

describe('ProfessorWeeklyDetailComponent', () => {
  let component: ProfessorWeeklyDetailComponent;
  let fixture: ComponentFixture<ProfessorWeeklyDetailComponent>;
  let assignmentServiceSpy: jasmine.SpyObj<AssignmentService>;

  const mockWeeklyDetail: WeeklyWorkDetail = {
    assignment_id: 1,
    persona_nombre: 'Ana María Gómez',
    workspace_nombre: 'Desarrollo en la Nube',
    week: '2026-W42',
    contracted_hours: 10,
    reported_hours: 14,
    report_status: 'REPORTED',
    is_overcompleted: true,
    tasks: [
      {
        id: 1,
        assignment_id: 1,
        week: '2026-W42',
        title: 'Calificación Taller 1',
        description: 'Revisión entregas',
        status: 'FINALIZADA',
        hours_spent: 8,
        observations: 'Notas en el LMS',
        is_late_report: false
      },
      {
        id: 2,
        assignment_id: 1,
        week: '2026-W42',
        title: 'Atención a estudiantes',
        description: 'Dudas sobre el taller',
        status: 'FINALIZADA',
        hours_spent: 6,
        observations: 'Sesión virtual',
        is_late_report: true
      }
    ]
  };

  beforeEach(async () => {
    assignmentServiceSpy = jasmine.createSpyObj('AssignmentService', ['getWeeklyDetail']);
    assignmentServiceSpy.getWeeklyDetail.and.returnValue(of(mockWeeklyDetail));

    await TestBed.configureTestingModule({
      imports: [ProfessorWeeklyDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '1' : null)
              }
            }
          }
        },
        { provide: AssignmentService, useValue: assignmentServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorWeeklyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load weekly detail on init', () => {
    expect(component).toBeTruthy();
    expect(assignmentServiceSpy.getWeeklyDetail).toHaveBeenCalledWith(1, undefined);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ana María Gómez');
    expect(compiled.textContent).toContain('Desarrollo en la Nube');
    expect(compiled.textContent).toContain('Calificación Taller 1');
  });

  it('should display overcompletion indicator when reported hours exceed contracted hours', () => {
    const overcompletionBadge = fixture.debugElement.query(By.css('.badge.bg-warning'));
    expect(overcompletionBadge).toBeTruthy();
    expect(overcompletionBadge.nativeElement.textContent).toContain('Sobrecumplimiento');
  });

  it('should display "Tardío" badge for late reported tasks', () => {
    const lateBadge = fixture.debugElement.query(By.css('.badge-late'));
    expect(lateBadge).toBeTruthy();
    expect(lateBadge.nativeElement.textContent).toContain('Tardío');
  });

  it('should reload detail when selected week changes', () => {
    component.onWeekChange('2026-W41');
    expect(assignmentServiceSpy.getWeeklyDetail).toHaveBeenCalledWith(1, '2026-W41');
  });
});
