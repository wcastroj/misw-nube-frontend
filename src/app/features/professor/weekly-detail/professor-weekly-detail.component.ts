import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AssignmentService } from '../../../core/services/assignment.service';
import { WeeklyWorkDetail } from '../../../core/models/assignment.model';
import { IsoWeekPipe } from '../../../shared/pipes/iso-week.pipe';
import { TaskStatusPipe } from '../../../shared/pipes/task-status.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-professor-weekly-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, IsoWeekPipe, TaskStatusPipe, EmptyStateComponent],
  templateUrl: './professor-weekly-detail.component.html'
})
export class ProfessorWeeklyDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private assignmentService = inject(AssignmentService);

  public assignmentId!: number;
  public weeklyDetail: WeeklyWorkDetail | null = null;
  public selectedWeek: string = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.assignmentId = Number(idParam);
      this.loadWeeklyDetail();
    }
  }

  loadWeeklyDetail(week?: string): void {
    this.assignmentService.getWeeklyDetail(this.assignmentId, week).subscribe({
      next: (detail) => {
        this.weeklyDetail = detail;
        if (!this.selectedWeek && detail?.week) {
          this.selectedWeek = detail.week;
        }
      },
      error: () => {}
    });
  }

  onWeekChange(newWeek: string): void {
    this.selectedWeek = newWeek;
    this.loadWeeklyDetail(newWeek);
  }
}
