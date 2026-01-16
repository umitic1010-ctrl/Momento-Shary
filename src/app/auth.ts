import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface User {
  userId: number;
  username: string;
  email?: string;
}

interface LoginResponse {
  userId: number;
  username: string;
  email?: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'https://10.0.0.89:7296/api/Auth';
  
  private readonly currentUser = signal<User | null>(null);

  public async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.API_URL}/login`, { username, password })
      );
      
      this.currentUser.set({
        userId: response.userId,
        username: response.username,
        email: response.email
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  public logout(): void {
    this.currentUser.set(null);
  }

  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  getUsername(): string | null {
    return this.currentUser()?.username ?? null;
  }

  getUserId(): number | null {
    return this.currentUser()?.userId ?? null;
  }
}