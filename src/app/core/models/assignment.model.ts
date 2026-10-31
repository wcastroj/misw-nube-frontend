import { AssignmentRole } from './workspace.model';
import { Task } from './task.model';

export interface AssignmentSummary {
  id: number;
  persona_id: number;
  persona_nombre: string;
  persona_email?: string;
  workspace_id: number;
  workspace_nombre: string;
  rol: AssignmentRole;
  contracted_hours: number;
  reported_hours: number;
  report_status: 'REPORTED' | 'NO_REPORT';
}

export interface AssignmentsResponse {
  week: string;
  assignments: AssignmentSummary[];
}

export interface WeeklyWorkDetail {
  assignment_id: number;
  persona_nombre: string;
  workspace_nombre: string;
  week: string;
  contracted_hours: number;
  reported_hours: number;
  report_status: 'REPORTED' | 'NO_REPORT';
  is_overcompleted?: boolean;
  tasks: Task[];
}

export interface ConsolidatedWeek {
  week: string;
  contracted_hours: number;
  reported_hours: number;
  report_status: 'REPORTED' | 'NO_REPORT';
  task_count: number;
}

export interface ConsolidatedSummary {
  assignment_id: number;
  persona_nombre: string;
  workspace_nombre: string;
  total_contracted_hours: number;
  total_reported_hours: number;
  compliance_percentage: number;
  weeks_without_report_count: number;
  weeks: ConsolidatedWeek[];
}
