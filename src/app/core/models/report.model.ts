export type ReportStatus = 'PENDIENTE' | 'GENERADO' | 'FALLIDO';

export interface ReportPerson {
  id: number;
  full_name: string;
}

export interface ReportWorkspace {
  id: number;
  name: string;
  type: string;
}

export interface ReportBatch {
  batch_id: number;
  week: string;
  created_at: string;
  total_reports: number;
  status_counts: { pending: number; generated: number; failed: number };
  reports: {
    report_id: number;
    assignment_id: number;
    person: ReportPerson;
    role: string;
    workspace: ReportWorkspace;
    status: ReportStatus;
    failure_reason: string | null;
  }[];
}

export interface ReportListItem {
  report_id: number;
  batch_id: number;
  assignment_id: number;
  person: ReportPerson;
  role: string;
  workspace: ReportWorkspace;
  professor: ReportPerson;
  week: string;
  generated_at: string;
}
