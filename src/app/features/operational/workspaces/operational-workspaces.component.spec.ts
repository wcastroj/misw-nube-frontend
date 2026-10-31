import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { OperationalWorkspacesComponent } from './operational-workspaces.component';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { OperationalWorkspace } from '../../../core/models/workspace.model';
import { By } from '@angular/platform-browser';

describe('OperationalWorkspacesComponent', () => {
  let component: OperationalWorkspacesComponent;
  let fixture: ComponentFixture<OperationalWorkspacesComponent>;
  let workspaceServiceSpy: jasmine.SpyObj<WorkspaceService>;

  const mockWorkspaces: OperationalWorkspace[] = [
    {
      assignment_id: 10,
      workspace_id: 101,
      workspace_nombre: 'Desarrollo de Software en la Nube',
      tipo: 'CURSO',
      profesor_nombre: 'Profesor Carlos',
      profesor_email: 'carlos@uniandes.edu.co',
      rol: 'GRADUATE_ASSISTANT',
      horas_semanales: 20,
      estado: 'ACTIVO'
    },
    {
      assignment_id: 11,
      workspace_id: 102,
      workspace_nombre: 'Proyecto Ágil',
      tipo: 'PROYECTO',
      profesor_nombre: 'Profesora María',
      profesor_email: 'maria@uniandes.edu.co',
      rol: 'MONITOR',
      horas_semanales: 10,
      estado: 'CERRADO'
    }
  ];

  beforeEach(async () => {
    workspaceServiceSpy = jasmine.createSpyObj('WorkspaceService', ['getMyWorkspaces']);

    await TestBed.configureTestingModule({
      imports: [OperationalWorkspacesComponent],
      providers: [
        provideRouter([]),
        { provide: WorkspaceService, useValue: workspaceServiceSpy }
      ]
    }).compileComponents();
  });

  it('should render table/cards with assigned workspaces and semantic badges', () => {
    workspaceServiceSpy.getMyWorkspaces.and.returnValue(of(mockWorkspaces));

    fixture = TestBed.createComponent(OperationalWorkspacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Desarrollo de Software en la Nube');
    expect(compiled.textContent).toContain('Proyecto Ágil');
    expect(compiled.textContent).toContain('Profesor Carlos');
    expect(compiled.textContent).toContain('Asistente Graduado');
    expect(compiled.textContent).toContain('Monitor');

    const activeBadge = fixture.debugElement.query(By.css('.badge.bg-success'));
    expect(activeBadge.nativeElement.textContent).toContain('Activo');

    const closedBadge = fixture.debugElement.query(By.css('.badge.bg-secondary'));
    expect(closedBadge.nativeElement.textContent).toContain('Cerrado');
  });

  it('should render empty state component when user has no assigned workspaces', () => {
    workspaceServiceSpy.getMyWorkspaces.and.returnValue(of([]));

    fixture = TestBed.createComponent(OperationalWorkspacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const emptyState = fixture.debugElement.query(By.css('app-empty-state'));
    expect(emptyState).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('No tienes cursos ni proyectos asignados');
  });
});
