import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AssignmentService } from '../../../core/services/assignment.service';
import { ConsolidatedSummary } from '../../../core/models/assignment.model';
import { IsoWeekPipe } from '../../../shared/pipes/iso-week.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-professor-consolidated-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, IsoWeekPipe, EmptyStateComponent],
  templateUrl: './professor-consolidated-detail.component.html'
})
export class ProfessorConsolidatedDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private assignmentService = inject(AssignmentService);

  public assignmentId!: number;
  public consolidated: ConsolidatedSummary | null = null;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.assignmentId = Number(idParam);
      this.loadConsolidated();
    }
  }

  loadConsolidated(): void {
    this.assignmentService.getConsolidatedDetail(this.assignmentId).subscribe({
      next: (summary) => {
        this.consolidated = summary;
      },
      error: () => {}
    });
  }
}
