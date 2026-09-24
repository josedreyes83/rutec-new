import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { LoginRequest, LoginResponse, UserInfo } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'rutec_access_token';
  private readonly REFRESH_KEY = 'rutec_refresh_token';
  private readonly USER_KEY = 'rutec_user';

  private currentUser = signal<UserInfo | null>(this.loadUser());

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => !!this.currentUser());

  constructor(
    private http: HttpClient,
    private router: Router,
    private api: ApiService
  ) {}

  login(request: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.api.baseUrl}/auth/login`, request).pipe(
      tap(response => {
        this.storeTokens(response);
        this.currentUser.set(response.usuario);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  refreshToken() {
    const accessToken = this.getAccessToken();
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);

    if (!accessToken || !refreshToken) return null;

    return this.http.post<LoginResponse>(`${this.api.baseUrl}/auth/refresh-token`, {
      accessToken,
      refreshToken
    }).pipe(
      tap(response => {
        this.storeTokens(response);
        this.currentUser.set(response.usuario);
      })
    );
  }

  getMe() {
    return this.http.get<UserInfo>(`${this.api.baseUrl}/auth/me`).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  private storeTokens(response: LoginResponse) {
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_KEY, response.refreshToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.usuario));
  }

  private loadUser(): UserInfo | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }
}
