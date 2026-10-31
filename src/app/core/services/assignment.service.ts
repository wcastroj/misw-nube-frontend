import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssignmentsResponse, WeeklyWorkDetail, ConsolidatedSummary } from '../models/assignment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private http = inject(HttpClient);

  getAssignments(): Observable<AssignmentsResponse> {
    return this.http.get<AssignmentsResponse>(`${environment.apiUrl}/assignments`);
  }

  getWeeklyDetail(assignmentId: number, week?: string): Observable<WeeklyWorkDetail> {
    let params = new HttpParams();
    if (week) {
      params = params.set('week', week);
    }
    return this.http.get<WeeklyWorkDetail>(`${environment.apiUrl}/assignments/${assignmentId}/weekly`, { params });
  }

  getConsolidatedDetail(assignmentId: number): Observable<ConsolidatedSummary> {
    return this.http.get<ConsolidatedSummary>(`${environment.apiUrl}/assignments/${assignmentId}/consolidated`);
  }
}
