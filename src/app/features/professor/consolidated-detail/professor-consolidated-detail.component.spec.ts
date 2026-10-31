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
    assignment_id: 2,
    persona_nombre: 'Carlos Pérez',
    workspace_nombre: 'Arquitecturas Ágiles',
    total_contracted_hours: 80,
    total_reported_hours: 72,
    compliance_percentage: 90,
    weeks_without_report_count: 2,
    weeks: [
      {
        week: '2026-W42',
        contracted_hours: 10,
        reported_hours: 10,
        report_status: 'REPORTED',
        task_count: 3
      },
      {
        week: '2026-W41',
        contracted_hours: 10,
        reported_hours: 0,
        report_status: 'NO_REPORT',
        task_count: 0
      }
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
  });
});
