import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-cambiar-clave',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InputTextModule, ButtonModule, MessageModule],
  template: `
    <div class="page-header">
      <h2>RUTEC - MODULO ADMINISTRACION</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-lock" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>CAMBIE LOS DATOS DE ACCESO Y MEJORE LA SEGURIDAD DE SU CUENTA</strong><br>
        Cambie la clave regularmente y proteja su cuenta de accesos no autorizados.
      </div>
    </div>

    <div class="subtitle">CAMBIO DE CONTRASEÑA</div>
    <hr>

    @if (mensaje()) {
      <p-message [severity]="mensajeTipo()" [text]="mensaje()" styleClass="msg" />
    }

    <div class="form-card">
      <div class="form-group">
        <label>Usuario</label>
        <input pInputText [value]="authService.user()?.email || ''" readonly class="readonly" />
      </div>

      <div class="form-group">
        <label>Contraseña actual</label>
        <input pInputText type="password" [(ngModel)]="currentPassword" />
      </div>

      <hr>

      <div class="form-group">
        <label>Contraseña nueva</label>
        <input pInputText type="password" [(ngModel)]="newPassword" placeholder="Por seguridad de su cuenta el Ministerio recomienda cambiar la contraseña que recibió." />
      </div>

      <div class="form-group">
        <label>Verificación de nueva contraseña</label>
        <input pInputText type="password" [(ngModel)]="confirmPassword" />
      </div>

      <p-button label="Cambiar mi contraseña" icon="pi pi-key" (click)="cambiar()" [loading]="loading()" />
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1rem; }
    .page-header h2 { color: #333; font-size: 1rem; font-weight: 600; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #1565c0; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.25rem;
      background: white; font-size: 0.85rem;
    }
    .subtitle { font-size: 0.85rem; font-weight: 600; color: #37474f; margin-bottom: 0.5rem; }
    .form-card {
      background: white; border-radius: 8px; padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08); max-width: 500px;
    }
    .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
    .form-group label { font-weight: 600; font-size: 0.85rem; color: #37474f; }
    .form-group input { width: 100%; }
    .readonly { background: #f5f5f5; color: #78909c; }
    .msg { display: block; margin-bottom: 1rem; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 0.75rem 0; }
  `]
})
export class CambiarClaveComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = signal(false);
  mensaje = signal('');
  mensajeTipo = signal<'success' | 'error'>('success');

  constructor(
    public authService: AuthService,
    private http: HttpClient,
    private api: ApiService
  ) {}

  cambiar() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.mostrar('Todos los campos son obligatorios', 'error');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.mostrar('La nueva contraseña y la verificación no coinciden', 'error');
      return;
    }

    this.loading.set(true);
    this.http.post(`${this.api.baseUrl}/auth/change-password`, {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.mostrar('Contraseña cambiada exitosamente', 'success');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.loading.set(false);
        const errors = err.error?.errors;
        this.mostrar(errors ? errors.join('. ') : 'Error al cambiar contraseña', 'error');
      }
    });
  }

  private mostrar(texto: string, tipo: 'success' | 'error') {
    this.mensaje.set(texto);
    this.mensajeTipo.set(tipo);
    setTimeout(() => this.mensaje.set(''), 5000);
  }
}
