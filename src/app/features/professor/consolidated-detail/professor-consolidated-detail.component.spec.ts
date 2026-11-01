import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ProfessorConsolidatedDetailComponent } from './professor-consolidated-detail.component';
import { AssignmentService } from '../../../core/services/assignment.service';
import { ConsolidatedSummary } from '../../../core/models/assignment.model';
import { By } from '@angular/platform-browser';

describe('ProfessorConsolidatedDetailComponent', () => {
  let component: ProfessorConsolidatedDetailComponent;
  let fixture: ComponentFixture<ProfessorConsolidatedDetailComponent>;
  let assignmentServiceSpy: jasmine.SpyObj<AssignmentService>;

  const mockConsolidated: ConsolidatedSummary = {
    student: { user_id: 11, user_name: 'Carlos Pérez' },
    workspace: { workspace_id: 5, workspace_name: 'Arquitecturas Ágiles', workspace_status: 'ACTIVO' },
    role: 'MONITOR',
    weekly_hours: 10,
    summary: {
      start_week: '2026-W35',
      end_week: '2026-W42',
      total_weeks_evaluated: 8,
      reported_weeks_count: 6,
      no_report_weeks_count: 2,
      expected_hours: 80,
      total_hours_spent: 72,
      total_tasks: 15,
      hours_balance: -8,
      compliance_percentage: 90
    },
    weeks: [
      { week: '2026-W42', total_hours_spent: 10, task_count: 3, status: 'REPORTED', has_late_reports: true },
      { week: '2026-W41', total_hours_spent: 0, task_count: 0, status: 'NO_REPORT', has_late_reports: false }
    ]
  };

  beforeEach(async () => {
    assignmentServiceSpy = jasmine.createSpyObj('AssignmentService', ['getConsolidatedDetail']);
    assignmentServiceSpy.getConsolidatedDetail.and.returnValue(of(mockConsolidated));

    await TestBed.configureTestingModule({
      imports: [ProfessorConsolidatedDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '2' : null)
              }
            }
          }
        },
        { provide: AssignmentService, useValue: assignmentServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorConsolidatedDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load consolidated summary on init', () => {
    expect(component).toBeTruthy();
    expect(assignmentServiceSpy.getConsolidatedDetail).toHaveBeenCalledWith(2);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Carlos Pérez');
    expect(compiled.textContent).toContain('Arquitecturas Ágiles');
    expect(compiled.textContent).toContain('90%');
    expect(compiled.textContent).toContain('72');
    expect(compiled.textContent).toContain('80');
  });

  it('should render table rows for weeks and mark weeks without report with badge bg-danger', () => {
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2);

    const dangerBadge = fixture.debugElement.query(By.css('.badge.bg-danger'));
    expect(dangerBadge).toBeTruthy();
    expect(dangerBadge.nativeElement.textContent).toContain('Sin reporte');

    expect(fixture.nativeElement.textContent).toContain('Tardío');
  });
});
