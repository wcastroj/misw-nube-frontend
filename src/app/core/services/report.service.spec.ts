import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { ReportBatch, ReportListItem } from '../models/report.model';
import { environment } from '../../../environments/environment';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ReportService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should trigger batch report via POST /reports/batch and unwrap data', () => {
    const batch: ReportBatch = {
      batch_id: 42,
      week: '2026-W41',
      created_at: '2026-10-31T23:30:38.123456Z',
      total_reports: 1,
      status_counts: { pending: 1, generated: 0, failed: 0 },
      reports: [
        {
          report_id: 19,
          assignment_id: 1,
          person: { id: 3, full_name: 'Ana María Gómez' },
          role: 'MONITOR',
          workspace: { id: 4, name: 'Nube', type: 'CURSO' },
          status: 'PENDIENTE',
          failure_reason: null
        }
      ]
    };

    service.triggerBatchReport('2026-W41').subscribe((res) => {
      expect(res).toEqual(batch);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reports/batch`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ week: '2026-W41' });
    req.flush({ data: batch });
  });

  it('should get reports for week via GET /reports?week= and return data.reports', () => {
    const reports: ReportListItem[] = [
      {
        report_id: 19,
        batch_id: 42,
        assignment_id: 1,
        person: { id: 3, full_name: 'Ana María Gómez' },
        role: 'MONITOR',
        workspace: { id: 4, name: 'Nube', type: 'CURSO' },
        professor: { id: 2, full_name: 'Professor User' },
        week: '2026-W41',
        generated_at: '2026-10-31T23:31:02.654321Z'
      }
    ];

    service.getReports('2026-W41').subscribe((res) => {
      expect(res).toEqual(reports);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reports?week=2026-W41`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: { week: '2026-W41', total_reports: 1, reports } });
  });

  it('should download report pdf via GET /reports/:id/download with blob response', () => {
    const dummyBlob = new Blob(['%PDF-1.4...'], { type: 'application/pdf' });

    service.downloadReportPdf(1).subscribe(res => {
      expect(res).toEqual(dummyBlob);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reports/1/download`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(dummyBlob);
  });

  it('should download batch zip via GET /reports/batch/:id/download with blob response', () => {
    const dummyBlob = new Blob(['PK...'], { type: 'application/zip' });

    service.downloadBatchZip(42).subscribe(res => {
      expect(res).toEqual(dummyBlob);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reports/batch/42/download`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(dummyBlob);
  });
});
