import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AuthService } from './core/services/auth.service';

import { LoginComponent } from './features/auth/login/login.component';
import { UnauthorizedComponent } from './features/auth/unauthorized/unauthorized.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';
import { ProfessorAssignmentsComponent } from './features/professor/assignments/professor-assignments.component';
import { ProfessorWeeklyDetailComponent } from './features/professor/weekly-detail/professor-weekly-detail.component';
import { ProfessorConsolidatedDetailComponent } from './features/professor/consolidated-detail/professor-consolidated-detail.component';
import { ProfessorReportsComponent } from './features/professor/reports/professor-reports.component';
import { OperationalWorkspacesComponent } from './features/operational/workspaces/operational-workspaces.component';
import { OperationalTasksComponent } from './features/operational/tasks/operational-tasks.component';
import { OperationalHistoryComponent } from './features/operational/history/operational-history.component';

export const rootRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  authService.redirectByRole();
  return false;
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent, canActivate: [authGuard] },

  // Admin Module
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] }
  },

  // Professor Module
  {
    path: 'professor/assignments',
    component: ProfessorAssignmentsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['professor'] }
  },
  {
    path: 'professor/assignments/:id/weekly',
    component: ProfessorWeeklyDetailComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['professor'] }
  },
  {
    path: 'professor/assignments/:id/consolidated',
    component: ProfessorConsolidatedDetailComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['professor'] }
  },
  {
    path: 'professor/reports',
    component: ProfessorReportsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['professor'] }
  },

  // Operational Module
  {
    path: 'operational/workspaces',
    component: OperationalWorkspacesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['operational'] }
  },
  {
    path: 'operational/workspaces/:assignmentId/tasks',
    component: OperationalTasksComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['operational'] }
  },
  {
    path: 'operational/workspaces/:assignmentId/history',
    component: OperationalHistoryComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['operational'] }
  },

  // Root and Wildcard
  { path: '', canActivate: [rootRedirectGuard], children: [] },
  { path: '**', canActivate: [rootRedirectGuard], children: [] }
];
