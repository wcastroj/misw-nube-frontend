import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AssignmentService } from '../../../core/services/assignment.service';
import { AssignmentSummary } from '../../../core/models/assignment.model';
import { AssignmentRole } from '../../../core/models/workspace.model';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IsoWeekPipe } from '../../../shared/pipes/iso-week.pipe';

@Component({
  selector: 'app-professor-assignments',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent, IsoWeekPipe],
  templateUrl: './professor-assignments.component.html'
})
export class ProfessorAssignmentsComponent implements OnInit {
  private assignmentService = inject(AssignmentService);

  public assignments: AssignmentSummary[] = [];
  public currentWeek: string = '';

  ngOnInit(): void {
    this.loadAssignments();
  }

  loadAssignments(): void {
    this.assignmentService.getAssignments().subscribe({
      next: (res) => {
        this.currentWeek = res.week;
        this.assignments = res.assignments || [];
      },
      error: () => {}
    });
  }

  getRoleLabel(rol: AssignmentRole): string {
    return rol === 'GRADUATE_ASSISTANT' ? 'Asistente Graduado' : 'Monitor';
  }
}
