import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OperationalWorkspace } from '../models/workspace.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private http = inject(HttpClient);

  getMyWorkspaces(): Observable<OperationalWorkspace[]> {
    return this.http.get<OperationalWorkspace[]>(`${environment.apiUrl}/workspaces`);
  }
}
