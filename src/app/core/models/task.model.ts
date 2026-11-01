export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

export interface TaskAttachment {
  id?: number;
  name?: string;
  file_name?: string;
  url: string;
}

export interface Task {
  id: number;
  week?: string;
  title: string;
  description: string;
  status: TaskStatus;
  observations?: string;
  hours_spent: number;
  is_late_report: boolean;
  created_at?: string;
  attachments?: TaskAttachment[];
}

export interface TaskList {
  assignment_id: number;
  week: string;
  total_hours_spent: number;
  tasks: Task[];
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

export interface CreateTaskResult {
  task_id: number;
  is_late_report: boolean;
  created_at: string;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  status: TaskStatus;
  hours_spent: number;
  observations?: string;
  attachments?: TaskAttachment[];
}

export interface WeeklyHistoryItem {
  week: string;
  total_hours_spent: number;
  task_count: number;
  status: 'REPORTED' | 'NO_REPORT';
  has_late_reports: boolean;
}

export interface WeeklyHistory {
  assignment_id: number;
  start_week: string;
  end_week: string;
  total_hours_spent: number;
  total_tasks: number;
  weeks: WeeklyHistoryItem[];
}
