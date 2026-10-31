import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { Task, CreateTaskRequest, UpdateTaskRequest, WeeklyHistoryItem } from '../models/task.model';
import { environment } from '../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create task via POST /tasks', () => {
    const payload: CreateTaskRequest = {
      assignment_id: 10,
      week: '2026-W42',
      title: 'Calificación Taller 1',
      description: 'Revisión de entregas',
      status: 'FINALIZADA',
      hours_spent: 4,
      observations: 'Completado'
    };

    const mockCreated: Task = {
      id: 50,
      ...payload,
      is_late_report: false
    };

    service.createTask(payload).subscribe(res => {
      expect(res).toEqual(mockCreated);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockCreated);
  });

  it('should get tasks via GET /tasks with assignment_id and optional week', () => {
    const mockTasks: Task[] = [
      {
        id: 50,
        assignment_id: 10,
        week: '2026-W42',
        title: 'Calificación Taller 1',
        description: 'Revisión',
        status: 'FINALIZADA',
        hours_spent: 4,
        is_late_report: false
      }
    ];

    service.getTasks(10, '2026-W42').subscribe(res => {
      expect(res).toEqual(mockTasks);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks?assignment_id=10&week=2026-W42`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);
  });

  it('should update task via PUT /tasks/:id', () => {
    const updatePayload: UpdateTaskRequest = {
      title: 'Calificación Taller 1 (Corregido)',
      hours_spent: 5
    };

    const mockUpdated: Task = {
      id: 50,
      assignment_id: 10,
      week: '2026-W42',
      title: 'Calificación Taller 1 (Corregido)',
      description: 'Revisión',
      status: 'FINALIZADA',
      hours_spent: 5,
      is_late_report: false
    };

    service.updateTask(50, updatePayload).subscribe(res => {
      expect(res).toEqual(mockUpdated);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/50`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatePayload);
    req.flush(mockUpdated);
  });

  it('should delete task via DELETE /tasks/:id', () => {
    service.deleteTask(50).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/50`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should get task history via GET /tasks/history?assignment_id=', () => {
    const mockHistory: WeeklyHistoryItem[] = [
      {
        week: '2026-W42',
        total_hours: 8,
        task_count: 2,
        status: 'REPORTED',
        has_late_reports: false
      }
    ];

    service.getTaskHistory(10).subscribe(res => {
      expect(res).toEqual(mockHistory);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/tasks/history?assignment_id=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockHistory);
  });
});
