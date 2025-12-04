import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

function getStorageSafe(): Storage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export interface AppUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  organizationId: string | null;
}

interface LoginResponse {
  accessToken: string;
  user: AppUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((res) => {
          const storage = getStorageSafe();
          if (!storage) return;
          storage.setItem('token', res.accessToken);
          storage.setItem('user', JSON.stringify(res.user));
        }),
      );
  }

  logout() {
    const storage = getStorageSafe();
    if (!storage) return;
    storage.removeItem('token');
    storage.removeItem('user');
  }

  isLoggedIn(): boolean {
    const storage = getStorageSafe();
    if (!storage) return false;
    return !!storage.getItem('token');
  }

  getUser(): AppUser | null {
    const storage = getStorageSafe();
    if (!storage) return null;
    const raw = storage.getItem('user');
    return raw ? (JSON.parse(raw) as AppUser) : null;
  }

  getToken(): string | null {
    const storage = getStorageSafe();
    if (!storage) return null;
    return storage.getItem('token');
  }

  getAllUsers() {
    return this.http.get<AppUser[]>(`${this.apiUrl}/users`);
  }

  createUser(email: string, name: string, role: 'ADMIN' | 'VIEWER') {
    return this.http.post<{ user: AppUser; password: string }>(
      `${this.apiUrl}/users/create`,
      { email, name, role },
    );
  }

  getProfile() {
    return this.http.get<AppUser>(`${this.apiUrl}/users/me`);
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/users/change-password`,
      { currentPassword, newPassword },
    );
  }
}
