import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ReportService } from '../../../core/services/report.service';
import { ReportSummary } from '../../../core/models/report.model';
import { IsoWeekPipe } from '../../../shared/pipes/iso-week.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-professor-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IsoWeekPipe, EmptyStateComponent],
  templateUrl: './professor-reports.component.html'
})
export class ProfessorReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private toastr = inject(ToastrService);

  public currentIsoWeek: string = this.computeCurrentIsoWeek();
  public selectedWeek: string = '';
  public closedWeeks: string[] = [];
  public reports: ReportSummary[] = [];
  public activeBatchId: number | null = null;

  ngOnInit(): void {
    this.generateClosedWeeks();
    if (!this.selectedWeek && this.closedWeeks.length > 0) {
      this.selectedWeek = this.closedWeeks[0];
    }
    if (this.selectedWeek) {
      this.loadReports(this.selectedWeek);
    }
  }

  isClosedWeek(week: string): boolean {
    if (!week) return false;
    return week < this.currentIsoWeek;
  }

  loadReports(week: string): void {
    this.reportService.getReports(week).subscribe({
      next: (reports) => {
        this.reports = reports || [];
        if (reports && reports.length > 0 && reports[0].batch_id) {
          this.activeBatchId = reports[0].batch_id;
        }
      },
      error: () => {}
    });
  }

  onWeekSelect(week: string): void {
    this.selectedWeek = week;
    this.loadReports(week);
  }

  triggerBatch(): void {
    if (!this.isClosedWeek(this.selectedWeek)) {
      return;
    }

    this.reportService.triggerBatchReport(this.selectedWeek).subscribe({
      next: (res) => {
        this.activeBatchId = res.batch_id;
        this.toastr.success('La generación del lote de reportes ha sido iniciada exitosamente.');
        this.loadReports(this.selectedWeek);
      },
      error: () => {}
    });
  }

  downloadPdf(reportId: number, personName?: string): void {
    const filename = personName
      ? `reporte_${personName.replace(/\s+/g, '_')}_${this.selectedWeek}.pdf`
      : `reporte_${reportId}.pdf`;
    this.reportService.downloadReportPdf(reportId, filename).subscribe({
      error: () => {}
    });
  }

  downloadZip(): void {
    if (this.activeBatchId) {
      this.reportService.downloadBatchZip(this.activeBatchId, `lote_${this.selectedWeek}.zip`).subscribe({
        error: () => {}
      });
    }
  }

  private generateClosedWeeks(): void {
    // Generate the last 6 closed weeks for easy selection
    const weeks: string[] = [];
    const date = new Date();
    for (let i = 1; i <= 6; i++) {
      const pastDate = new Date(date.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      weeks.push(this.getIsoWeekFromDate(pastDate));
    }
    this.closedWeeks = weeks;
  }

  private computeCurrentIsoWeek(): string {
    return this.getIsoWeekFromDate(new Date());
  }

  private getIsoWeekFromDate(d: Date): string {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNr = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const year = new Date(firstThursday).getFullYear();
    return `${year}-W${weekNr < 10 ? '0' + weekNr : weekNr}`;
  }
}
