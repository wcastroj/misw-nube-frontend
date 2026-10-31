import { User } from './user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface LoginApiResponse {
  data: {
    token: string;
    id: number;
    name: string;
    email: string;
    role: User['role'];
  };
}

export interface SessionState {
  token: string | null;
  user: User | null;
}
