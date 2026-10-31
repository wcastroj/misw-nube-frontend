import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = (route.data && (route.data['roles'] as UserRole[])) || [];
  const currentRole = authService.getRole();

  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
