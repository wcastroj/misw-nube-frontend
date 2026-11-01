import { AssignmentRole } from './workspace.model';
import { Task } from './task.model';

export interface AssignmentSummary {
  id: number;
  user: { id: number; name: string };
  workspace: { id: number; name: string; type: string };
  role: AssignmentRole;
  contracted_hours: number;
  reported_hours: number;
}

export interface AssignmentsResponse {
  week: string;
  assignments: AssignmentSummary[];
}

export interface StudentRef {
  user_id: number;
  user_name: string;
}

export interface WorkspaceRef {
  workspace_id: number;
  workspace_name: string;
  workspace_status: string;
}

export interface WeeklyWorkDetail {
  student: StudentRef;
  workspace: WorkspaceRef;
  role: AssignmentRole;
  weekly_hours: number;
  week: string;
  status: 'REPORTED' | 'NO_REPORT';
  total_hours_spent: number;
  expected_hours: number;
  hours_balance: number;
  has_late_reports: boolean;
  tasks: Task[];
}

export interface ConsolidatedWeek {
  week: string;
  total_hours_spent: number;
  task_count: number;
  status: 'REPORTED' | 'NO_REPORT';
  has_late_reports: boolean;
}

export interface ConsolidatedSummary {
  student: StudentRef;
  workspace: WorkspaceRef;
  role: AssignmentRole;
  weekly_hours: number;
  summary: {
    start_week: string;
    end_week: string;
    total_weeks_evaluated: number;
    reported_weeks_count: number;
    no_report_weeks_count: number;
    expected_hours: number;
    total_hours_spent: number;
    total_tasks: number;
    hours_balance: number;
    compliance_percentage: number;
  };
  weeks: ConsolidatedWeek[];
}
