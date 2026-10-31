import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unauthorized.component.html'
})
export class UnauthorizedComponent {
  private authService = inject(AuthService);

  returnToMain(): void {
    this.authService.redirectByRole();
  }
}
