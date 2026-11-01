import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { TaskService } from '../../../core/services/task.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Task, TaskStatus } from '../../../core/models/task.model';
import { OperationalWorkspace } from '../../../core/models/workspace.model';
import { IsoWeekPipe } from '../../../shared/pipes/iso-week.pipe';
import { TaskStatusPipe } from '../../../shared/pipes/task-status.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-operational-tasks',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, IsoWeekPipe, TaskStatusPipe, EmptyStateComponent],
  templateUrl: './operational-tasks.component.html'
})
export class OperationalTasksComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private workspaceService = inject(WorkspaceService);
  private toastr = inject(ToastrService);

  public assignmentId!: number;
  public workspace: OperationalWorkspace | null = null;
  public tasks: Task[] = [];
  public currentIsoWeek: string = this.computeCurrentIsoWeek();
  public availableWeeks: string[] = [];
  public isLateReportWarning: boolean = false;

  public isEditing: boolean = false;
  public editingTaskId: number | null = null;
  public showDeleteModal: boolean = false;
  public taskToDelete: Task | null = null;

  public taskForm: FormGroup = this.fb.group({
    week: ['', [Validators.required]],
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    status: ['COMPLETED' as TaskStatus, [Validators.required]],
    hours_spent: ['', [Validators.required, Validators.pattern('^[1-9][0-9]*$')]],
    observations: ['']
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('assignmentId');
    if (idParam) {
      this.assignmentId = Number(idParam);
      this.generateAvailableWeeks();
      this.taskForm.get('week')?.setValue(this.currentIsoWeek);
      this.loadWorkspace();
      this.loadTasks();
    }

    this.taskForm.get('week')?.valueChanges.subscribe((selectedWeek) => {
      this.checkLateReport(selectedWeek);
    });
  }

  get totalReportedHours(): number {
    return this.tasks.reduce((sum, t) => sum + (Number(t.hours_spent) || 0), 0);
  }

  loadWorkspace(): void {
    this.workspaceService.getMyWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspace = workspaces.find((w) => w.assignment_id === this.assignmentId) || null;
      },
      error: () => {}
    });
  }

  loadTasks(): void {
    this.taskService.getTasks(this.assignmentId, this.currentIsoWeek).subscribe({
      next: (res) => {
        this.tasks = res.tasks;
      },
      error: () => {}
    });
  }

  checkLateReport(selectedWeek: string): void {
    this.isLateReportWarning = !!selectedWeek && selectedWeek < this.currentIsoWeek;
  }

  canModifyTask(task: Task): boolean {
    if (!this.workspace || this.workspace.estado !== 'ACTIVO') {
      return false;
    }
    if (task.is_late_report) {
      return false;
    }
    if (task.week !== this.currentIsoWeek) {
      return false;
    }
    return true;
  }

  submitTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const formValues = this.taskForm.value;
    const hours = parseInt(formValues.hours_spent, 10);

    if (this.isEditing && this.editingTaskId) {
      this.taskService.updateTask(this.editingTaskId, {
        title: formValues.title,
        description: formValues.description,
        status: formValues.status,
        hours_spent: hours,
        observations: formValues.observations
      }).subscribe({
        next: () => {
          this.toastr.success('Tarea actualizada exitosamente.');
          this.resetForm();
          this.loadTasks();
        },
        error: () => {}
      });
    } else {
      this.taskService.createTask({
        assignment_id: this.assignmentId,
        week: formValues.week,
        title: formValues.title,
        description: formValues.description,
        status: formValues.status,
        hours_spent: hours,
        observations: formValues.observations
      }).subscribe({
        next: (res) => {
          this.toastr.success('Tarea registrada exitosamente.');
          if (res.is_late_report) {
            this.toastr.warning('La tarea quedó registrada como reporte tardío y no podrá modificarse.', 'Reporte tardío');
          }
          this.resetForm();
          this.loadTasks();
        },
        error: () => {}
      });
    }
  }

  editTask(task: Task): void {
    if (!this.canModifyTask(task)) return;

    this.isEditing = true;
    this.editingTaskId = task.id;
    this.taskForm.patchValue({
      week: task.week,
      title: task.title,
      description: task.description,
      status: task.status,
      hours_spent: task.hours_spent.toString(),
      observations: task.observations || ''
    });
    this.checkLateReport(this.currentIsoWeek);
  }

  cancelEdit(): void {
    this.resetForm();
  }

  openDeleteModal(task: Task): void {
    this.taskToDelete = task;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.taskToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete(taskParam?: Task): void {
    const task = taskParam || this.taskToDelete;
    if (!task) return;

    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.toastr.success('Tarea eliminada exitosamente.');
        this.closeDeleteModal();
        this.loadTasks();
      },
      error: () => {}
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingTaskId = null;
    this.taskForm.reset({
      week: this.currentIsoWeek,
      title: '',
      description: '',
      status: 'COMPLETED',
      hours_spent: '',
      observations: ''
    });
    this.checkLateReport(this.currentIsoWeek);
  }

  private generateAvailableWeeks(): void {
    // Current week and 5 past weeks (future weeks blocked)
    const weeks: string[] = [];
    const date = new Date();
    for (let i = 0; i <= 5; i++) {
      const pastDate = new Date(date.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      weeks.push(this.getIsoWeekFromDate(pastDate));
    }
    this.availableWeeks = weeks;
  }

  private computeCurrentIsoWeek(): string {
    return this.getIsoWeekFromDate(new Date());
  }

  private getIsoWeekFromDate(d: Date): string {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNr = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const year = new Date(firstThursday).getFullYear();
    return `${year}-W${weekNr < 10 ? '0' + weekNr : weekNr}`;
  }
}
