import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { WorkspaceService } from './workspace.service';
import { OperationalWorkspace } from '../models/workspace.model';
import { environment } from '../../../environments/environment';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WorkspaceService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(WorkspaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch operational workspaces via GET /workspaces', () => {
    const mockWorkspaces: OperationalWorkspace[] = [
      {
        assignment_id: 10,
        workspace_id: 101,
        workspace_nombre: 'Desarrollo en la Nube',
        tipo: 'CURSO',
        profesor_nombre: 'Profesor Carlos',
        profesor_email: 'carlos@uniandes.edu.co',
        rol: 'GRADUATE_ASSISTANT',
        horas_semanales: 20,
        estado: 'ACTIVO'
      }
    ];

    service.getMyWorkspaces().subscribe(res => {
      expect(res).toEqual(mockWorkspaces);
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/workspaces`);
    expect(req.request.method).toBe('GET');
    req.flush(mockWorkspaces);
  });
});
