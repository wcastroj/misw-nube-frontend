import { Pipe, PipeTransform } from '@angular/core';
import { TaskStatus } from '../../core/models/task.model';

const LABELS: Record<TaskStatus, string> = {
  OPEN: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Finalizada'
};

@Pipe({
  name: 'taskStatus',
  standalone: true
})
export class TaskStatusPipe implements PipeTransform {
  transform(status: TaskStatus | string | null | undefined): string {
    return (status && LABELS[status as TaskStatus]) || status || '';
  }
}
