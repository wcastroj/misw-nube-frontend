import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import {
  CreateTaskRequest,
  CreateTaskResult,
  Task,
  TaskList,
  UpdateTaskRequest,
  WeeklyHistory
} from '../models/task.model';
import { environment } from '../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const task: Task = {
    id: 50,
    week: '2026-W42',
    title: 'Calificación Taller 1',
    description: 'Revisión de entregas',
    status: 'COMPLETED',
    hours_spent: 4,
    observations: 'Completado',
    is_late_report: false,
    attachments: []
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create task via POST /tasks and unwrap data', () => {
    const payload: CreateTaskRequest = {
      assignment_id: 10,
      week: '2026-W42',
      title: 'Calificación Taller 1',
      description: 'Revisión de entregas',
      status: 'COMPLETED',
      hours_spent: 4,
      observations: 'Completado'
    };
    const result: CreateTaskResult = { task_id: 50, is_late_report: false, created_at: '2026-10-15T10:00:00Z' };

    service.createTask(payload).subscribe((res) => {
      expect(res).toEqual(result);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: result });
  });

  it('should get tasks via GET /tasks with assignment_id and week and unwrap data', () => {
    const list: TaskList = { assignment_id: 10, week: '2026-W42', total_hours_spent: 4, tasks: [task] };

    service.getTasks(10, '2026-W42').subscribe((res) => {
      expect(res).toEqual(list);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks?assignment_id=10&week=2026-W42`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: list });
  });

  it('should update task via PUT /tasks/:id and unwrap data', () => {
    const payload: UpdateTaskRequest = {
      title: 'Calificación Taller 1 (Corregido)',
      description: 'Revisión de entregas',
      status: 'COMPLETED',
      hours_spent: 5
    };
    const updated: Task = { ...task, title: payload.title, hours_spent: 5 };

    service.updateTask(50, payload).subscribe((res) => {
      expect(res).toEqual(updated);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/50`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ data: updated });
  });

  it('should delete task via DELETE /tasks/:id', () => {
    service.deleteTask(50).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/50`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ data: { id: 50, message: 'Tarea eliminada correctamente' } });
  });

  it('should get task history via GET /tasks/history and unwrap data', () => {
    const history: WeeklyHistory = {
      assignment_id: 10,
      start_week: '2026-W41',
      end_week: '2026-W42',
      total_hours_spent: 8,
      total_tasks: 2,
      weeks: [
        { week: '2026-W42', total_hours_spent: 8, task_count: 2, status: 'REPORTED', has_late_reports: false },
        { week: '2026-W41', total_hours_spent: 0, task_count: 0, status: 'NO_REPORT', has_late_reports: false }
      ]
    };

    service.getTaskHistory(10).subscribe((res) => {
      expect(res).toEqual(history);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/history?assignment_id=10`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: history });
  });
});
