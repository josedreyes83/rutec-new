import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CalidadService } from '../../../core/services/calidad.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface TabOption { label: string; value: string; }
interface UsuarioAdmin { userName: string; }

@Component({
  selector: 'app-asignar-revisor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    SelectButtonModule,
    InputNumberModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast />

    <h3 class="page-title">REGISTRO UNICO DE TRABAJADORES EXTRANJEROS EN COLOMBIA - RUTEC</h3>

    <div class="info-bar">
      <i class="pi pi-id-card" style="font-size:1.5rem; color:#1565c0"></i>
      <div><strong>CONSULTAR USUARIOS VERIFICADORES!</strong></div>
    </div>

    <div class="section-header">
      <h4>USUARIOS DE GESTION</h4>
    </div>

    <p-selectbutton
      [options]="tabOptions"
      [(ngModel)]="tabSeleccionado"
      (onChange)="cambiarTab($event.value)"
      optionLabel="label"
      optionValue="value"
    />

    <p-card styleClass="form-card">
      <div class="form-grid">
        <label for="usuario">Usuario</label>
        <p-select
          inputId="usuario"
          [options]="usuarios()"
          [(ngModel)]="usuarioSeleccionado"
          optionLabel="userName"
          optionValue="userName"
          placeholder="Seleccione un usuario..."
          [style]="{ width: '100%' }"
          [loading]="loadingUsuarios()"
        />

        @if (tabSeleccionado === 'cantidad') {
          <label for="cantidad">Cantidad de contratos disponibles para revisión</label>
          <div class="cantidad-wrap">
            <div class="disponibles-text">Registros disponibles: {{ disponibles() }}</div>
            <p-inputNumber
              inputId="cantidad"
              [(ngModel)]="cantidad"
              [min]="0"
              [max]="disponibles()"
              [showButtons]="true"
              [style]="{ width: '100%' }"
              placeholder="0"
            />
          </div>
        } @else {
          <label for="numContrato">Ingrese Numero de contrato</label>
          <div class="cantidad-wrap">
            <p-inputNumber
              inputId="numContrato"
              [(ngModel)]="numeroContrato"
              [min]="0"
              [useGrouping]="false"
              [style]="{ width: '100%' }"
              placeholder="Ej: 261224"
            />
            @if (errorContrato()) {
              <div class="error-text">{{ errorContrato() }}</div>
            }
          </div>
        }

        <div></div>
        <div>
          <p-button
            label="Asignar contratos"
            icon="pi pi-check"
            severity="info"
            (onClick)="asignar()"
            [loading]="enviando()"
            [disabled]="!puedeAsignar()"
          />
        </div>
      </div>
    </p-card>

    <div class="actions-bottom">
      <p-button
        label="Regresar"
        icon="pi pi-arrow-left"
        severity="secondary"
        (onClick)="regresar()"
      />
    </div>
  `,
  styles: [`
    .page-title { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #1565c0; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.25rem;
      background: white; font-size: 0.85rem;
    }
    .section-header { margin-bottom: 0.5rem; }
    .section-header h4 { font-size: 0.95rem; font-weight: 700; color: #333; }
    :host ::ng-deep .p-selectbutton { margin-bottom: 1rem; }
    :host ::ng-deep .form-card {
      max-width: 600px;
      margin: 0 auto;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 1rem 1rem;
      align-items: center;
    }
    .form-grid label {
      font-weight: 600;
      font-size: 0.85rem;
      color: #333;
    }
    .cantidad-wrap { display: flex; flex-direction: column; gap: 0.35rem; }
    .disponibles-text {
      color: #c62828;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .error-text {
      color: #c62828;
      font-size: 0.8rem;
      font-weight: 500;
      margin-top: 0.25rem;
    }
    .actions-bottom {
      max-width: 600px;
      margin: 1rem auto 0;
      display: flex;
      justify-content: flex-start;
    }
  `]
})
export class AsignarRevisorComponent implements OnInit {
  private service = inject(CalidadService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  tabOptions: TabOption[] = [
    { label: 'Asignar Revisor Cant. Contratos', value: 'cantidad' },
    { label: 'Asignar Revisor a Contrato', value: 'contrato' }
  ];
  tabSeleccionado = 'cantidad';

  usuarios = signal<UsuarioAdmin[]>([]);
  loadingUsuarios = signal(false);
  disponibles = signal(0);
  enviando = signal(false);
  errorContrato = signal('');

  usuarioSeleccionado: string | null = null;
  cantidad: number | null = null;
  numeroContrato: number | null = null;

  puedeAsignar(): boolean {
    if (!this.usuarioSeleccionado) return false;
    if (this.tabSeleccionado === 'cantidad') return (this.cantidad ?? 0) > 0;
    return (this.numeroContrato ?? 0) > 0;
  }

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarDisponibles();
  }

  cargarUsuarios() {
    this.loadingUsuarios.set(true);
    this.service.getUsuariosAdmin().subscribe({
      next: (data) => { this.usuarios.set(data ?? []); this.loadingUsuarios.set(false); },
      error: () => { this.usuarios.set([]); this.loadingUsuarios.set(false); }
    });
  }

  cargarDisponibles() {
    this.service.getContratosDisponiblesCount().subscribe({
      next: (r) => this.disponibles.set(r?.count ?? 0),
      error: () => this.disponibles.set(0)
    });
  }

  cambiarTab(value: string) {
    this.tabSeleccionado = value;
    this.errorContrato.set('');
  }

  asignar() {
    if (!this.usuarioSeleccionado) return;
    this.errorContrato.set('');

    if (this.tabSeleccionado === 'cantidad') {
      if (!this.cantidad || this.cantidad <= 0) return;
      if (this.cantidad > this.disponibles()) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cantidad inválida',
          detail: `La cantidad no puede superar los ${this.disponibles()} registros disponibles.`
        });
        return;
      }

      this.enviando.set(true);
      this.service.asignarContratosMasivo(this.usuarioSeleccionado, this.cantidad).subscribe({
        next: (r) => {
          this.enviando.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Asignación exitosa',
            detail: `Se asignaron ${r?.asignados ?? 0} contratos a ${this.usuarioSeleccionado}.`
          });
          setTimeout(() => this.router.navigate(['/calidad/verificadores']), 800);
        },
        error: () => {
          this.enviando.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo completar la asignación.'
          });
        }
      });
    } else {
      if (!this.numeroContrato || this.numeroContrato <= 0) return;
      this.enviando.set(true);
      this.service.asignarContratoUnico(this.usuarioSeleccionado, this.numeroContrato).subscribe({
        next: () => {
          this.enviando.set(false);
          this.messageService.add({
            severity: 'success',
            summary: 'Asignación exitosa',
            detail: `Contrato ${this.numeroContrato} asignado a ${this.usuarioSeleccionado}.`
          });
          setTimeout(() => this.router.navigate(['/calidad/verificadores']), 800);
        },
        error: (err) => {
          this.enviando.set(false);
          const msg = err?.error?.message || 'No se pudo asignar el contrato.';
          this.errorContrato.set(msg);
        }
      });
    }
  }

  regresar() {
    this.router.navigate(['/calidad/verificadores']);
  }
}
