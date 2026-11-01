import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AssignmentService } from './assignment.service';
import { AssignmentsResponse, WeeklyWorkDetail, ConsolidatedSummary } from '../models/assignment.model';
import { environment } from '../../../environments/environment';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AssignmentService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AssignmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch assignments list via GET /assignments', () => {
    const mockResponse: AssignmentsResponse = {
      week: '2026-W42',
      assignments: [
        {
          id: 101,
          user: { id: 12, name: 'Juan Monitor' },
          workspace: { id: 5, name: 'MISW4204', type: 'COURSE' },
          role: 'MONITOR',
          contracted_hours: 10,
          reported_hours: 8
        }
      ]
    };

    service.getAssignments().subscribe(res => {
      expect(res).toEqual(mockResponse);
      expect(res.assignments.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/assignments`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  const weeklyDetail = (week: string): WeeklyWorkDetail => ({
    student: { user_id: 12, user_name: 'Juan Monitor' },
    workspace: { workspace_id: 5, workspace_name: 'MISW4204', workspace_status: 'ACTIVO' },
    role: 'MONITOR',
    weekly_hours: 10,
    week,
    status: 'REPORTED',
    total_hours_spent: 8,
    expected_hours: 10,
    hours_balance: -2,
    has_late_reports: false,
    tasks: []
  });

  it('should fetch weekly detail via GET /assignments/:id/weekly and unwrap data', () => {
    const detail = weeklyDetail('2026-W42');

    service.getWeeklyDetail(101).subscribe((res) => {
      expect(res).toEqual(detail);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/assignments/101/weekly`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: detail });
  });

  it('should fetch weekly detail via GET /assignments/:id/weekly with week query param', () => {
    const detail = weeklyDetail('2026-W41');

    service.getWeeklyDetail(101, '2026-W41').subscribe((res) => {
      expect(res).toEqual(detail);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/assignments/101/weekly?week=2026-W41`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: detail });
  });

  it('should fetch consolidated detail via GET /assignments/:id/consolidated and unwrap data', () => {
    const consolidated: ConsolidatedSummary = {
      student: { user_id: 12, user_name: 'Juan Monitor' },
      workspace: { workspace_id: 5, workspace_name: 'MISW4204', workspace_status: 'ACTIVO' },
      role: 'MONITOR',
      weekly_hours: 10,
      summary: {
        start_week: '2026-W41',
        end_week: '2026-W42',
        total_weeks_evaluated: 2,
        reported_weeks_count: 1,
        no_report_weeks_count: 1,
        expected_hours: 20,
        total_hours_spent: 8,
        total_tasks: 2,
        hours_balance: -12,
        compliance_percentage: 40
      },
      weeks: []
    };

    service.getConsolidatedDetail(101).subscribe((res) => {
      expect(res).toEqual(consolidated);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/assignments/101/consolidated`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: consolidated });
  });
});
