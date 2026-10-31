export type TaskStatus = 'FINALIZADA' | 'PENDIENTE';

export interface TaskAttachment {
  name: string;
  url: string;
}

export interface Task {
  id: number;
  assignment_id: number;
  week: string;
  title: string;
  description: string;
  status: TaskStatus;
  observations?: string;
  hours_spent: number;
  is_late_report?: boolean;
  attachments?: TaskAttachment[];
}

export interface CreateTaskRequest {
  assignment_id: number;
  week: string;
  title: string;
  description: string;
  status: TaskStatus;
  observations?: string;
  hours_spent: number;
  attachments?: TaskAttachment[];
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  observations?: string;
  hours_spent?: number;
  attachments?: TaskAttachment[];
}

export interface WeeklyHistoryItem {
  week: string;
  total_hours: number;
  task_count: number;
  status: 'REPORTED' | 'NO_REPORT';
  has_late_reports: boolean;
  tasks?: Task[];
}
