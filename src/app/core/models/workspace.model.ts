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
  assignment_id: number;
  workspace_id: number;
  workspace_nombre: string;
  tipo?: WorkspaceType;
  profesor_nombre: string;
  profesor_email?: string;
  rol: AssignmentRole;
  horas_semanales: number;
  estado: WorkspaceStatus;
}
