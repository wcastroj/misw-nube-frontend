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
        id: 101,
        tipo: 'CURSO',
        nombre: 'Desarrollo en la Nube',
        estado: 'ACTIVO',
        fechaInicio: '2026-08-03',
        fechaFin: '2026-11-28',
        observaciones: '',
        periodo: { id: 1, codigo: '2026-02' },
        profesor: { nombre: 'Profesor Carlos', email: 'carlos@uniandes.edu.co' },
        rolVinculacion: 'GRADUATE_ASSISTANT',
        horasSemanales: 20
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
