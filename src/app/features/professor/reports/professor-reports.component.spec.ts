import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProfessorReportsComponent } from './professor-reports.component';
import { ReportService } from '../../../core/services/report.service';
import { ReportBatch, ReportListItem } from '../../../core/models/report.model';
import { By } from '@angular/platform-browser';

describe('ProfessorReportsComponent', () => {
  let component: ProfessorReportsComponent;
  let fixture: ComponentFixture<ProfessorReportsComponent>;
  let reportServiceSpy: jasmine.SpyObj<ReportService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  const mockBatchResponse: ReportBatch = {
    batch_id: 88,
    week: '2026-W41',
    created_at: '2026-10-31T23:30:38.123456Z',
    total_reports: 2,
    status_counts: { pending: 2, generated: 0, failed: 0 },
    reports: []
  };

  const reportItem = (reportId: number, personId: number, name: string): ReportListItem => ({
    report_id: reportId,
    batch_id: 88,
    assignment_id: reportId,
    person: { id: personId, full_name: name },
    role: 'MONITOR',
    workspace: { id: 4, name: 'Desarrollo en la Nube', type: 'CURSO' },
    professor: { id: 2, full_name: 'Professor User' },
    week: '2026-W41',
    generated_at: '2026-10-31T23:31:02.654321Z'
  });

  const mockReports: ReportListItem[] = [
    reportItem(1, 10, 'Ana María Gómez'),
    reportItem(2, 11, 'Carlos Pérez')
  ];

  beforeEach(async () => {
    reportServiceSpy = jasmine.createSpyObj('ReportService', [
      'triggerBatchReport',
      'getReports',
      'downloadReportPdf',
      'downloadBatchZip'
    ]);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    reportServiceSpy.getReports.and.returnValue(of(mockReports));
    reportServiceSpy.triggerBatchReport.and.returnValue(of(mockBatchResponse));
    reportServiceSpy.downloadReportPdf.and.returnValue(of(new Blob()));
    reportServiceSpy.downloadBatchZip.and.returnValue(of(new Blob()));

    await TestBed.configureTestingModule({
      imports: [ProfessorReportsComponent],
      providers: [
        provideRouter([]),
        { provide: ReportService, useValue: reportServiceSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfessorReportsComponent);
    component = fixture.componentInstance;
  });

  it('should create and load reports for initial closed week', () => {
    component.currentIsoWeek = '2026-W42';
    component.selectedWeek = '2026-W41';
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(reportServiceSpy.getReports).toHaveBeenCalledWith('2026-W41');

    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Ana María Gómez');
    expect(component.activeBatchId).toBe(88);
  });

  it('should disable batch generation button if selected week is current week or future', () => {
    component.currentIsoWeek = '2026-W42';
    component.selectedWeek = '2026-W42';
    fixture.detectChanges();

    const batchButton = fixture.debugElement.query(By.css('.btn-generate-batch'));
    expect(batchButton.nativeElement.disabled).toBeTrue();
  });

  it('should enable batch button for closed week, call triggerBatchReport and show success toastr', () => {
    component.currentIsoWeek = '2026-W42';
    component.selectedWeek = '2026-W41';
    fixture.detectChanges();

    const batchButton = fixture.debugElement.query(By.css('.btn-generate-batch'));
    expect(batchButton.nativeElement.disabled).toBeFalse();

    batchButton.triggerEventHandler('click', null);

    expect(reportServiceSpy.triggerBatchReport).toHaveBeenCalledWith('2026-W41');
    expect(toastrSpy.success).toHaveBeenCalledWith(jasmine.stringContaining('2 reporte(s)'), 'Lote iniciado');
  });

  it('should call downloadReportPdf when individual download button is clicked', () => {
    component.currentIsoWeek = '2026-W42';
    component.selectedWeek = '2026-W41';
    fixture.detectChanges();

    const downloadButtons = fixture.debugElement.queryAll(By.css('.btn-download-pdf'));
    expect(downloadButtons.length).toBe(2);

    downloadButtons[0].triggerEventHandler('click', null);
    expect(reportServiceSpy.downloadReportPdf).toHaveBeenCalledWith(1, jasmine.any(String));
  });

  it('should call downloadBatchZip when batch download button is clicked', () => {
    component.currentIsoWeek = '2026-W42';
    component.selectedWeek = '2026-W41';
    component.activeBatchId = 88;
    fixture.detectChanges();

    const batchZipBtn = fixture.debugElement.query(By.css('.btn-download-zip'));
    expect(batchZipBtn).toBeTruthy();

    batchZipBtn.triggerEventHandler('click', null);
    expect(reportServiceSpy.downloadBatchZip).toHaveBeenCalledWith(88, jasmine.any(String));
  });
});
