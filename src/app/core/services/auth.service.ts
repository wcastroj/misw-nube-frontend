import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { LoginApiResponse, LoginRequest, LoginResponse } from '../models/auth.model';
import { User, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginApiResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      map((res) => ({
        token: res.data.token,
        user: {
          id: res.data.id,
          nombre: res.data.name,
          email: res.data.email,
          role: res.data.role
        }
      })),
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this.currentUserSubject.next(res.user);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearSession();
      }),
      catchError(() => {
        // EARS-03.2: If network error occurs during logout, still force clearing session locally
        this.clearSession();
        return of(undefined as void);
      })
    );
  }

  clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  redirectByRole(role?: UserRole): void {
    const targetRole = role || this.getRole();

    switch (targetRole) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'professor':
        this.router.navigate(['/professor/assignments']);
        break;
      case 'operational':
        this.router.navigate(['/operational/workspaces']);
        break;
      default:
        this.router.navigate(['/login']);
        break;
    }
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) {
      return null;
    }
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  }
}
