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
      id: 101,
      tipo: 'CURSO',
      nombre: 'Desarrollo de Software en la Nube',
      estado: 'ACTIVO',
      fechaInicio: '2026-08-03',
      fechaFin: '2026-11-28',
      periodo: { id: 1, codigo: '2026-02' },
      profesor: { nombre: 'Profesor Carlos', email: 'carlos@uniandes.edu.co' },
      rolVinculacion: 'GRADUATE_ASSISTANT',
      horasSemanales: 20
    },
    {
      id: 102,
      tipo: 'PROYECTO',
      nombre: 'Proyecto Ágil',
      estado: 'CERRADO',
      fechaInicio: '2026-01-19',
      fechaFin: '2026-05-30',
      periodo: { id: 2, codigo: '2026-01' },
      profesor: { nombre: 'Profesora María', email: 'maria@uniandes.edu.co' },
      rolVinculacion: 'MONITOR',
      horasSemanales: 10,
      assignment_id: 11
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
    expect(compiled.textContent).toContain('20 h');
  });

  it('should disable task actions when the backend does not expose assignment_id', () => {
    workspaceServiceSpy.getMyWorkspaces.and.returnValue(of(mockWorkspaces));

    fixture = TestBed.createComponent(OperationalWorkspacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const disabledButtons = fixture.debugElement.queryAll(By.css('button[disabled]'));
    expect(disabledButtons.length).toBe(2);

    const links = fixture.debugElement.queryAll(By.css('a.btn'));
    expect(links.length).toBe(2);
    expect(links[0].nativeElement.getAttribute('href')).toContain('/operational/workspaces/11/tasks');
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
