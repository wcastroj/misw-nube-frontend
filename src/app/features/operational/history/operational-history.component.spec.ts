import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { OperationalHistoryComponent } from './operational-history.component';
import { TaskService } from '../../../core/services/task.service';
import { TaskList, WeeklyHistory } from '../../../core/models/task.model';
import { By } from '@angular/platform-browser';

describe('OperationalHistoryComponent', () => {
  let component: OperationalHistoryComponent;
  let fixture: ComponentFixture<OperationalHistoryComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;

  const mockHistory: WeeklyHistory = {
    assignment_id: 10,
    start_week: '2026-W41',
    end_week: '2026-W42',
    total_hours_spent: 8,
    total_tasks: 2,
    weeks: [
      { week: '2026-W42', total_hours_spent: 8, task_count: 2, status: 'REPORTED', has_late_reports: true },
      { week: '2026-W41', total_hours_spent: 0, task_count: 0, status: 'NO_REPORT', has_late_reports: false }
    ]
  };

  const mockWeekTasks: TaskList = {
    assignment_id: 10,
    week: '2026-W42',
    total_hours_spent: 8,
    tasks: [
      {
        id: 1,
        week: '2026-W42',
        title: 'Revisión código',
        description: 'PRs de estudiantes',
        status: 'COMPLETED',
        hours_spent: 4,
        is_late_report: false
      },
      {
        id: 2,
        week: '2026-W42',
        title: 'Calificación Taller',
        description: 'Rúbrica aplicada',
        status: 'IN_PROGRESS',
        hours_spent: 4,
        is_late_report: true
      }
    ]
  };

  beforeEach(async () => {
    taskServiceSpy = jasmine.createSpyObj('TaskService', ['getTaskHistory', 'getTasks']);
    taskServiceSpy.getTaskHistory.and.returnValue(of(mockHistory));
    taskServiceSpy.getTasks.and.returnValue(of(mockWeekTasks));

    await TestBed.configureTestingModule({
      imports: [OperationalHistoryComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'assignmentId' ? '10' : null)
              }
            }
          }
        },
        { provide: TaskService, useValue: taskServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationalHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load history weeks on init (EARS-13.1)', () => {
    expect(component).toBeTruthy();
    expect(taskServiceSpy.getTaskHistory).toHaveBeenCalledWith(10);

    const rows = fixture.debugElement.queryAll(By.css('.history-week-row'));
    expect(rows.length).toBe(2);

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Reportado');
    expect(compiled.textContent).toContain('Sin reporte');
    expect(compiled.textContent).toContain('Reportes tardíos');
  });

  it('should expand week tasks when clicking on row (EARS-13.2)', () => {
    const rows = fixture.debugElement.queryAll(By.css('.history-week-row'));
    rows[0].nativeElement.click();
    fixture.detectChanges();

    expect(component.expandedWeek).toBe('2026-W42');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Revisión código');
    expect(compiled.textContent).toContain('Calificación Taller');
    expect(compiled.textContent).toContain('En progreso');
    expect(taskServiceSpy.getTasks).toHaveBeenCalledWith(10, '2026-W42');
  });
});
