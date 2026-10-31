export interface BatchReportResponse {
  batch_id: number;
  status: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'FALLIDO';
  week: string;
  message?: string;
}

export interface ReportSummary {
  id: number;
  batch_id?: number;
  week: string;
  person_id: number;
  person_name: string;
  status: string;
  file_url?: string;
  created_at?: string;
}
