import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest, WeeklyHistoryItem } from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);

  createTask(payload: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${environment.apiUrl}/tasks`, payload);
  }

  getTasks(assignmentId: number, week?: string): Observable<Task[]> {
    let params = new HttpParams().set('assignment_id', assignmentId.toString());
    if (week) {
      params = params.set('week', week);
    }
    return this.http.get<Task[]>(`${environment.apiUrl}/tasks`, { params });
  }

  updateTask(taskId: number, payload: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${environment.apiUrl}/tasks/${taskId}`, payload);
  }

  deleteTask(taskId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tasks/${taskId}`);
  }

  getTaskHistory(assignmentId: number): Observable<WeeklyHistoryItem[]> {
    const params = new HttpParams().set('assignment_id', assignmentId.toString());
    return this.http.get<WeeklyHistoryItem[]>(`${environment.apiUrl}/tasks/history`, { params });
  }
}
