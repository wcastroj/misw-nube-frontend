import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { BatchReportResponse, ReportSummary } from '../models/report.model';
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

  it('should trigger batch report via POST /reports/batch', () => {
    const mockBatchResponse: BatchReportResponse = {
      batch_id: 42,
      status: 'PENDIENTE',
      week: '2026-W41',
      message: 'Batch report initiated'
    };

    service.triggerBatchReport('2026-W41').subscribe(res => {
      expect(res).toEqual(mockBatchResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reports/batch`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ week: '2026-W41' });
    req.flush(mockBatchResponse);
  });

  it('should get reports for week via GET /reports?week=', () => {
    const mockReports: ReportSummary[] = [
      {
        id: 1,
        batch_id: 42,
        week: '2026-W41',
        person_id: 10,
        person_name: 'Ana María Gómez',
        status: 'COMPLETADO'
      }
    ];

    service.getReports('2026-W41').subscribe(res => {
      expect(res).toEqual(mockReports);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/reports?week=2026-W41`);
    expect(req.request.method).toBe('GET');
    req.flush(mockReports);
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
