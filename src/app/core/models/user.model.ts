export type UserRole = 'admin' | 'professor' | 'operational';

export interface User {
  id: number;
  nombre: string;
  email: string;
  role: UserRole;
}
