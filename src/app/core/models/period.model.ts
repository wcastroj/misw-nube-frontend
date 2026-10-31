export interface AcademicPeriod {
  id: number;
  codigo: string;
  fechaInicio: string;
  fechaFin: string;
  fechaLimite: string;
  estado?: 'ACTIVO' | 'CERRADO';
}
