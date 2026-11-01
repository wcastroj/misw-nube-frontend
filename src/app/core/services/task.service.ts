import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  CreateTaskRequest,
  CreateTaskResult,
  Task,
  TaskList,
  UpdateTaskRequest,
  WeeklyHistory
} from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);

  createTask(payload: CreateTaskRequest): Observable<CreateTaskResult> {
    return this.http
      .post<{ data: CreateTaskResult }>(`${environment.apiUrl}/tasks`, payload)
      .pipe(map((res) => res.data));
  }

  getTasks(assignmentId: number, week?: string): Observable<TaskList> {
    let params = new HttpParams().set('assignment_id', assignmentId.toString());
    if (week) {
      params = params.set('week', week);
    }
    return this.http
      .get<{ data: TaskList }>(`${environment.apiUrl}/tasks`, { params })
      .pipe(map((res) => res.data));
  }

  updateTask(taskId: number, payload: UpdateTaskRequest): Observable<Task> {
    return this.http
      .put<{ data: Task }>(`${environment.apiUrl}/tasks/${taskId}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http
      .delete<{ data: unknown }>(`${environment.apiUrl}/tasks/${taskId}`)
      .pipe(map(() => undefined));
  }

  getTaskHistory(assignmentId: number): Observable<WeeklyHistory> {
    const params = new HttpParams().set('assignment_id', assignmentId.toString());
    return this.http
      .get<{ data: WeeklyHistory }>(`${environment.apiUrl}/tasks/history`, { params })
      .pipe(map((res) => res.data));
  }
}
