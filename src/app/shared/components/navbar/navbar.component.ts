import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);

  public currentUser$ = this.authService.currentUser$;

  getRoleLabel(role?: UserRole): string {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'professor':
        return 'Docente';
      case 'operational':
        return 'Monitor / Asistente';
      default:
        return '';
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.toastr.info('Has cerrado sesión correctamente.');
      },
      error: () => {
        this.toastr.info('Has cerrado sesión correctamente.');
      }
    });
  }
}
