import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { OperationalTasksComponent } from './operational-tasks.component';
import { TaskService } from '../../../core/services/task.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Task, TaskList } from '../../../core/models/task.model';
import { OperationalWorkspace } from '../../../core/models/workspace.model';
import { By } from '@angular/platform-browser';

describe('OperationalTasksComponent', () => {
  let component: OperationalTasksComponent;
  let fixture: ComponentFixture<OperationalTasksComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let workspaceServiceSpy: jasmine.SpyObj<WorkspaceService>;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  const mockWorkspace: OperationalWorkspace = {
    id: 101,
    tipo: 'CURSO',
    nombre: 'Desarrollo en la Nube',
    estado: 'ACTIVO',
    fechaInicio: '2026-08-03',
    fechaFin: '2026-11-28',
    periodo: { id: 1, codigo: '2026-02' },
    profesor: { nombre: 'Profesor Carlos', email: 'carlos@uniandes.edu.co' },
    rolVinculacion: 'MONITOR',
    horasSemanales: 10,
    assignment_id: 10
  };

  const mockTasks: Task[] = [
    {
      id: 1,
      week: '2026-W42',
      title: 'Tarea Activa Editable',
      description: 'Descripción de prueba',
      status: 'COMPLETED',
      hours_spent: 4,
      is_late_report: false,
      attachments: [{ id: 9, name: 'guia.pdf', url: 'https://example.com/guia.pdf' }]
    },
    {
      id: 2,
      week: '2026-W41',
      title: 'Tarea Tardía Inmutable',
      description: 'Reportada a destiempo',
      status: 'OPEN',
      hours_spent: 3,
      is_late_report: true
    }
  ];

  const mockTaskList: TaskList = { assignment_id: 10, week: '2026-W42', total_hours_spent: 7, tasks: mockTasks };

  beforeEach(async () => {
    taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getTasks',
      'createTask',
      'updateTask',
      'deleteTask'
    ]);
    workspaceServiceSpy = jasmine.createSpyObj('WorkspaceService', ['getMyWorkspaces']);
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'warning']);

    taskServiceSpy.getTasks.and.returnValue(of(mockTaskList));
    taskServiceSpy.createTask.and.returnValue(
      of({ task_id: 3, is_late_report: false, created_at: '2026-10-15T10:00:00Z' })
    );
    taskServiceSpy.updateTask.and.returnValue(of(mockTasks[0]));
    taskServiceSpy.deleteTask.and.returnValue(of(undefined));
    workspaceServiceSpy.getMyWorkspaces.and.returnValue(of([mockWorkspace]));

    await TestBed.configureTestingModule({
      imports: [OperationalTasksComponent, ReactiveFormsModule],
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
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: WorkspaceService, useValue: workspaceServiceSpy },
        { provide: ToastrService, useValue: toastrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationalTasksComponent);
    component = fixture.componentInstance;
    component.currentIsoWeek = '2026-W42';
    fixture.detectChanges();
  });

  it('should create and load tasks and workspace info', () => {
    expect(component).toBeTruthy();
    expect(taskServiceSpy.getTasks).toHaveBeenCalledWith(10, '2026-W42');
    expect(component.workspace?.nombre).toBe('Desarrollo en la Nube');
    expect(component.tasks.length).toBe(2);
  });

  it('should invalidate hours_spent when 0, negative, or decimal (EARS-11.7)', () => {
    const hoursControl = component.taskForm.get('hours_spent');

    hoursControl?.setValue('0');
    expect(hoursControl?.valid).toBeFalse();

    hoursControl?.setValue('-3');
    expect(hoursControl?.valid).toBeFalse();

    hoursControl?.setValue('2.5');
    expect(hoursControl?.valid).toBeFalse();

    hoursControl?.setValue('169');
    expect(hoursControl?.valid).toBeFalse();

    hoursControl?.setValue('4');
    expect(hoursControl?.valid).toBeTrue();
  });

  it('should enforce backend length rules for title and description', () => {
    component.taskForm.get('title')?.setValue('ab');
    expect(component.taskForm.get('title')?.valid).toBeFalse();
    component.taskForm.get('title')?.setValue('abc');
    expect(component.taskForm.get('title')?.valid).toBeTrue();

    component.taskForm.get('description')?.setValue('abcd');
    expect(component.taskForm.get('description')?.valid).toBeFalse();
    component.taskForm.get('description')?.setValue('abcde');
    expect(component.taskForm.get('description')?.valid).toBeTrue();
  });

  it('should keep existing attachments when updating a task (PUT replaces the whole task)', () => {
    component.editTask(mockTasks[0]);
    component.taskForm.patchValue({ hours_spent: '6' });

    component.submitTask();

    expect(taskServiceSpy.updateTask).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({
        hours_spent: 6,
        status: 'COMPLETED',
        attachments: [{ file_name: 'guia.pdf', url: 'https://example.com/guia.pdf' }]
      })
    );
    expect(toastrSpy.success).toHaveBeenCalledWith('Tarea actualizada exitosamente.');
  });

  it('should activate late report warning when selecting a past week in the form (EARS-11.4)', () => {
    component.currentIsoWeek = '2026-W42';
    component.taskForm.get('week')?.setValue('2026-W41');
    fixture.detectChanges();

    expect(component.isLateReportWarning).toBeTrue();
    const warningEl = fixture.debugElement.query(By.css('.alert-warning-late'));
    expect(warningEl).toBeTruthy();
    expect(warningEl.nativeElement.textContent).toContain('Reporte Tardío');
  });

  it('should create task and show toastr.success upon valid form submission (EARS-11.5)', () => {
    component.taskForm.setValue({
      week: '2026-W42',
      title: 'Nueva Tarea Calificada',
      description: 'Detalle de la tarea',
      status: 'COMPLETED',
      hours_spent: 5,
      observations: 'Comentarios adicionales'
    });

    component.submitTask();

    expect(taskServiceSpy.createTask).toHaveBeenCalledWith(jasmine.objectContaining({ assignment_id: 10, status: 'COMPLETED' }));
    expect(toastrSpy.success).toHaveBeenCalledWith('Tarea registrada exitosamente.');
    expect(toastrSpy.warning).not.toHaveBeenCalled();
  });

  it('should warn with toastr when the created task is a late report', () => {
    taskServiceSpy.createTask.and.returnValue(of({ task_id: 4, is_late_report: true, created_at: '2026-10-15T10:00:00Z' }));
    component.taskForm.setValue({
      week: '2026-W41',
      title: 'Tarea tardía',
      description: 'Registrada después',
      status: 'COMPLETED',
      hours_spent: 2,
      observations: ''
    });

    component.submitTask();

    expect(toastrSpy.warning).toHaveBeenCalled();
  });

  it('should allow edit and delete only for current week, active workspace and non-late tasks (EARS-12.1, EARS-12.2)', () => {
    // Task 1: week === '2026-W42', is_late_report === false, workspace is ACTIVO -> editable & deletable
    expect(component.canModifyTask(mockTasks[0])).toBeTrue();

    // Task 2: is_late_report === true -> inmutable
    expect(component.canModifyTask(mockTasks[1])).toBeFalse();
  });

  it('should disallow edit and delete when workspace is CERRADO', () => {
    component.workspace = { ...mockWorkspace, estado: 'CERRADO' };
    expect(component.canModifyTask(mockTasks[0])).toBeFalse();
  });

  it('should delete task after user confirms and show toastr.success (EARS-12.3, EARS-12.4)', () => {
    component.confirmDelete(mockTasks[0]);

    expect(taskServiceSpy.deleteTask).toHaveBeenCalledWith(1);
    expect(toastrSpy.success).toHaveBeenCalledWith('Tarea eliminada exitosamente.');
  });
});
