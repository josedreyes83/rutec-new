import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule],
  template: `
    <div class="page-header">
      <h2>ADMINISTRACION - USUARIOS</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-users" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>GESTION DE USUARIOS</strong><br>
        Consulte los usuarios registrados en el sistema.
      </div>
    </div>

    <p-table
      [value]="usuarios()"
      [loading]="loading()"
      [tableStyle]="{'min-width': '60rem'}"
      [paginator]="true"
      [rows]="15"
      [rowsPerPageOptions]="[10, 15, 25, 50]"
      [showCurrentPageReport]="true"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
      [globalFilterFields]="['userName', 'email', 'nombre']"
      stripedRows
    >
      <ng-template #header>
        <tr>
          <th pSortableColumn="userName">USERNAME <p-sortIcon field="userName" /></th>
          <th pSortableColumn="email">EMAIL <p-sortIcon field="email" /></th>
          <th pSortableColumn="nombre">NOMBRE <p-sortIcon field="nombre" /></th>
          <th>ACTIVO</th>
          <th>ROLES</th>
          <th pSortableColumn="ultimoAcceso">ULTIMO ACCESO <p-sortIcon field="ultimoAcceso" /></th>
        </tr>
      </ng-template>
      <ng-template #body let-u>
        <tr>
          <td>{{ u.userName }}</td>
          <td>{{ u.email }}</td>
          <td>{{ u.nombre }}</td>
          <td>
            @if (u.activo) {
              <p-tag value="Activo" severity="success" />
            } @else {
              <p-tag value="Inactivo" severity="danger" />
            }
          </td>
          <td>
            @for (rol of u.roles; track rol) {
              <p-tag [value]="rol" severity="info" styleClass="mr-1" />
            }
            @if (!u.roles || u.roles.length === 0) {
              <span style="color:#90a4ae">Sin roles</span>
            }
          </td>
          <td>{{ u.ultimoAcceso | date:'dd/MM/yyyy HH:mm' }}</td>
        </tr>
      </ng-template>
      <ng-template #emptymessage>
        <tr><td colspan="6" style="text-align:center; padding:2rem; color:#90a4ae;">No se encontraron usuarios</td></tr>
      </ng-template>
    </p-table>
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
    :host ::ng-deep .mr-1 { margin-right: 0.25rem; }
  `]
})
export class UsuarioListComponent implements OnInit {
  private service = inject(AdminService);

  usuarios = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.cargar();
  }

  private cargar() {
    this.loading.set(true);
    this.service.getUsuarios().subscribe({
      next: (data) => { this.usuarios.set(data); this.loading.set(false); },
      error: () => { this.usuarios.set([]); this.loading.set(false); }
    });
  }
}
