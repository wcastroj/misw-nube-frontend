import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ProfessorAssignmentsComponent } from './professor-assignments.component';
import { AssignmentService } from '../../../core/services/assignment.service';
import { AssignmentsResponse } from '../../../core/models/assignment.model';
import { By } from '@angular/platform-browser';

describe('ProfessorAssignmentsComponent', () => {
  let component: ProfessorAssignmentsComponent;
  let fixture: ComponentFixture<ProfessorAssignmentsComponent>;
  let assignmentServiceSpy: jasmine.SpyObj<AssignmentService>;

  const mockResponseWithItems: AssignmentsResponse = {
    week: '2026-W42',
    assignments: [
      {
        id: 1,
        persona_id: 10,
        persona_nombre: 'Ana María Gómez',
        persona_email: 'ana@uniandes.edu.co',
        workspace_id: 101,
        workspace_nombre: 'Desarrollo de Software en la Nube',
        rol: 'GRADUATE_ASSISTANT',
        contracted_hours: 20,
        reported_hours: 18,
        report_status: 'REPORTED'
      },
      {
        id: 2,
        persona_id: 11,
        persona_nombre: 'Carlos Pérez',
        persona_email: 'carlos@uniandes.edu.co',
        workspace_id: 102,
        workspace_nombre: 'Arquitecturas Ágiles',
        rol: 'MONITOR',
        contracted_hours: 10,
        reported_hours: 0,
        report_status: 'NO_REPORT'
      }
    ]
  };

  const mockEmptyResponse: AssignmentsResponse = {
    week: '2026-W42',
    assignments: []
  };

  beforeEach(async () => {
    assignmentServiceSpy = jasmine.createSpyObj('AssignmentService', ['getAssignments']);

    await TestBed.configureTestingModule({
      imports: [ProfessorAssignmentsComponent],
      providers: [
        provideRouter([]),
        { provide: AssignmentService, useValue: assignmentServiceSpy }
      ]
    }).compileComponents();
  });

  it('should render table with assignments and correct semantic badges', () => {
    assignmentServiceSpy.getAssignments.and.returnValue(of(mockResponseWithItems));

    fixture = TestBed.createComponent(ProfessorAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const tableRows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(tableRows.length).toBe(2);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ana María Gómez');
    expect(compiled.textContent).toContain('Carlos Pérez');
    expect(compiled.textContent).toContain('Asistente Graduado');
    expect(compiled.textContent).toContain('Monitor');

    const successBadge = fixture.debugElement.query(By.css('.badge.bg-success'));
    expect(successBadge.nativeElement.textContent).toContain('Reportado');

    const dangerBadge = fixture.debugElement.query(By.css('.badge.bg-danger'));
    expect(dangerBadge.nativeElement.textContent).toContain('Sin reporte');
  });

  it('should render empty state component when assignments array is empty', () => {
    assignmentServiceSpy.getAssignments.and.returnValue(of(mockEmptyResponse));

    fixture = TestBed.createComponent(ProfessorAssignmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const table = fixture.debugElement.query(By.css('table'));
    expect(table).toBeNull();

    const emptyState = fixture.debugElement.query(By.css('app-empty-state'));
    expect(emptyState).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('No cuentas con monitores o asistentes');
  });
});
