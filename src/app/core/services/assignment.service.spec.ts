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

  it('should fetch weekly detail via GET /assignments/:id/weekly without query param', () => {
    const mockDetail: WeeklyWorkDetail = {
      assignment_id: 101,
      persona_nombre: 'Juan Monitor',
      workspace_nombre: 'MISW4204',
      week: '2026-W42',
      contracted_hours: 10,
      reported_hours: 8,
      report_status: 'REPORTED',
      tasks: []
    };

    service.getWeeklyDetail(101).subscribe(res => {
      expect(res).toEqual(mockDetail);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/assignments/101/weekly`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDetail);
  });

  it('should fetch weekly detail via GET /assignments/:id/weekly with week query param', () => {
    const mockDetail: WeeklyWorkDetail = {
      assignment_id: 101,
      persona_nombre: 'Juan Monitor',
      workspace_nombre: 'MISW4204',
      week: '2026-W41',
      contracted_hours: 10,
      reported_hours: 12,
      report_status: 'REPORTED',
      is_overcompleted: true,
      tasks: []
    };

    service.getWeeklyDetail(101, '2026-W41').subscribe(res => {
      expect(res).toEqual(mockDetail);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/assignments/101/weekly?week=2026-W41`);
    expect(req.request.method).toBe('GET');
    req.flush(mockDetail);
  });

  it('should fetch consolidated detail via GET /assignments/:id/consolidated', () => {
    const mockConsolidated: ConsolidatedSummary = {
      assignment_id: 101,
      persona_nombre: 'Juan Monitor',
      workspace_nombre: 'MISW4204',
      total_contracted_hours: 160,
      total_reported_hours: 150,
      compliance_percentage: 93.75,
      weeks_without_report_count: 1,
      weeks: []
    };

    service.getConsolidatedDetail(101).subscribe(res => {
      expect(res).toEqual(mockConsolidated);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/assignments/101/consolidated`);
    expect(req.request.method).toBe('GET');
    req.flush(mockConsolidated);
  });
});
