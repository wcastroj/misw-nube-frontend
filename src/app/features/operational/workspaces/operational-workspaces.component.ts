import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { OperationalWorkspace, AssignmentRole } from '../../../core/models/workspace.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-operational-workspaces',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  templateUrl: './operational-workspaces.component.html'
})
export class OperationalWorkspacesComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);

  public workspaces: OperationalWorkspace[] = [];

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    this.workspaceService.getMyWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces || [];
      },
      error: () => {}
    });
  }

  getRoleLabel(rol: AssignmentRole): string {
    return rol === 'GRADUATE_ASSISTANT' ? 'Asistente Graduado' : 'Monitor';
  }
}
