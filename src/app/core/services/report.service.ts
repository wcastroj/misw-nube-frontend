import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { ReportBatch, ReportListItem } from '../models/report.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);

  triggerBatchReport(week: string): Observable<ReportBatch> {
    return this.http
      .post<{ data: ReportBatch }>(`${environment.apiUrl}/reports/batch`, { week })
      .pipe(map((res) => res.data));
  }

  getReports(week: string): Observable<ReportListItem[]> {
    const params = new HttpParams().set('week', week);
    return this.http
      .get<{ data: { reports: ReportListItem[] } }>(`${environment.apiUrl}/reports`, { params })
      .pipe(map((res) => res.data.reports));
  }

  downloadReportPdf(reportId: number, filename: string = `reporte_${reportId}.pdf`): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/reports/${reportId}/download`, {
      responseType: 'blob'
    }).pipe(
      tap((blob) => {
        this.saveBlobFile(blob, filename);
      })
    );
  }

  downloadBatchZip(batchId: number, filename: string = `lote_reportes_${batchId}.zip`): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/reports/batch/${batchId}/download`, {
      responseType: 'blob'
    }).pipe(
      tap((blob) => {
        this.saveBlobFile(blob, filename);
      })
    );
  }

  saveBlobFile(blob: Blob, filename: string): void {
    if (typeof window !== 'undefined' && window.URL) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  }
}
