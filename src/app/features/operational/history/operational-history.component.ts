import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { WeeklyHistoryItem, Task } from '../../../core/models/task.model';
import { IsoWeekPipe } from '../../../shared/pipes/iso-week.pipe';
import { TaskStatusPipe } from '../../../shared/pipes/task-status.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-operational-history',
  standalone: true,
  imports: [CommonModule, RouterModule, IsoWeekPipe, TaskStatusPipe, EmptyStateComponent],
  templateUrl: './operational-history.component.html'
})
export class OperationalHistoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);

  public assignmentId!: number;
  public historyWeeks: WeeklyHistoryItem[] = [];
  public expandedWeek: string | null = null;
  public expandedTasks: Task[] = [];

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('assignmentId');
    if (idParam) {
      this.assignmentId = Number(idParam);
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.taskService.getTaskHistory(this.assignmentId).subscribe({
      next: (history) => {
        this.historyWeeks = history.weeks;
      },
      error: () => {}
    });
  }

  toggleWeek(week: string): void {
    if (this.expandedWeek === week) {
      this.expandedWeek = null;
      this.expandedTasks = [];
      return;
    }

    this.expandedWeek = week;
    this.expandedTasks = [];
    this.taskService.getTasks(this.assignmentId, week).subscribe({
      next: (res) => {
        this.expandedTasks = res.tasks;
      },
      error: () => {}
    });
  }
}
