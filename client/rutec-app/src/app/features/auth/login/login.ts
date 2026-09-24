import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-bg">
      <div class="login-card">
        <div class="card-header">
          <img src="images/mintrabajo_logo.png" alt="Ministerio del Trabajo" class="logo" />
        </div>

        <form (ngSubmit)="onSubmit()" class="form">
          <input
            type="text"
            [(ngModel)]="email"
            name="email"
            placeholder="Usuario"
            [disabled]="loading()"
            class="field"
            autocomplete="username"
          />
          <input
            type="password"
            [(ngModel)]="password"
            name="password"
            placeholder="Contraseña"
            [disabled]="loading()"
            class="field"
            autocomplete="current-password"
          />

          @if (error()) {
            <div class="error">
              <i class="pi pi-exclamation-circle"></i>
              {{ error() }}
            </div>
          }

          <button type="submit" class="btn-ingresar" [disabled]="loading()">
            @if (loading()) {
              <i class="pi pi-spin pi-spinner"></i>
            }
            Ingresar
          </button>
        </form>

        <div class="card-footer">
          <img src="images/rutec.png" alt="RUTEC" class="rutec-logo" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-bg {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #3556a8;
    }
    .login-card {
      background: white;
      border-radius: 10px;
      padding: 2.5rem 2.5rem 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25);
    }
    .card-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .logo { height: 90px; }
    .form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .field {
      width: 100%;
      padding: 0.75rem 0.5rem;
      border: none;
      border-bottom: 2px solid #e0e0e0;
      font-size: 1rem;
      color: #333;
      background: transparent;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .field::placeholder { color: #9e9e9e; }
    .field:focus { border-bottom-color: #3556a8; }
    .field:disabled { opacity: 0.6; }
    .btn-ingresar {
      width: 100%;
      padding: 0.85rem;
      background: #43a047;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background 0.2s;
    }
    .btn-ingresar:hover { background: #388e3c; }
    .btn-ingresar:disabled { opacity: 0.7; cursor: not-allowed; }
    .error {
      background: #fce4ec;
      color: #c62828;
      padding: 0.6rem 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .card-footer {
      text-align: center;
      margin-top: 1.5rem;
    }
    .rutec-logo { height: 45px; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Ingrese usuario y contraseña');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al iniciar sesión');
      }
    });
  }
}
