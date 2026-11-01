export type WorkspaceType = 'CURSO' | 'PROYECTO';
export type WorkspaceStatus = 'ACTIVO' | 'CERRADO';
export type AssignmentRole = 'MONITOR' | 'GRADUATE_ASSISTANT';

export interface Workspace {
  id: number;
  nombre: string;
  tipo: WorkspaceType;
  periodo_id: number;
  fechaInicio?: string;
  fechaFin?: string;
  observaciones?: string;
  estado: WorkspaceStatus;
  profesor_id?: number;
  profesor_nombre?: string;
}

export interface OperationalWorkspace {
  id: number;
  tipo: WorkspaceType;
  nombre: string;
  estado: WorkspaceStatus;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
  periodo: { id: number; codigo: string };
  profesor: { nombre: string; email: string };
  rolVinculacion: AssignmentRole;
  horasSemanales: number;
  assignment_id: number;
}
