import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrabajadoresService } from '../../../core/services/trabajadores.service';
import { SharedService } from '../../../core/services/shared.service';
import { TrabajadorDetail, CodigoReferencia } from '../../../core/models/rutec.models';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-trabajador-editar',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    InputTextModule, SelectModule, DatePickerModule, ButtonModule
  ],
  template: `
    @if (loadingData()) {
      <div class="loading-msg"><i class="pi pi-spin pi-spinner"></i> Cargando datos del trabajador...</div>
    }

    @if (form) {
      <div class="page-header">
        <h2>EDITAR TRABAJADOR</h2>
      </div>

      <div class="info-bar">
        <i class="pi pi-pencil" style="font-size:1.5rem; color:#1565c0"></i>
        <div>
          <strong>EDICION DE DATOS PERSONALES</strong><br>
          Modifique los campos necesarios y guarde los cambios.
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="guardar()">
        <div class="form-grid">
          <div class="field">
            <label>Primer Nombre *</label>
            <input pInputText formControlName="primerNombre" />
          </div>
          <div class="field">
            <label>Segundo Nombre</label>
            <input pInputText formControlName="segundoNombre" />
          </div>
          <div class="field">
            <label>Primer Apellido *</label>
            <input pInputText formControlName="primerApellido" />
          </div>
          <div class="field">
            <label>Segundo Apellido</label>
            <input pInputText formControlName="segundoApellido" />
          </div>
          <div class="field">
            <label>Genero *</label>
            <p-select [options]="generos()" optionLabel="nombre" optionValue="codigo" formControlName="codigoGenero" placeholder="Seleccione..." />
          </div>
          <div class="field">
            <label>Estado Civil *</label>
            <p-select [options]="estadosCiviles()" optionLabel="nombre" optionValue="codigo" formControlName="codigoEstadoCivil" placeholder="Seleccione..." />
          </div>
          <div class="field">
            <label>Fecha de Nacimiento *</label>
            <p-datepicker formControlName="fechaNacimiento" dateFormat="dd/mm/yy" [showIcon]="true" />
          </div>
          <div class="field">
            <label>Pais de Nacimiento</label>
            <p-select [options]="paises()" optionLabel="nombre" optionValue="codigo" formControlName="codigoPaisNacimiento" placeholder="Seleccione..." [filter]="true" />
          </div>
          <div class="field">
            <label>Pais de Ciudadania</label>
            <p-select [options]="paises()" optionLabel="nombre" optionValue="codigo" formControlName="codigoPaisCiudadania" placeholder="Seleccione..." [filter]="true" />
          </div>
          <div class="field">
            <label>Tipo de Visa</label>
            <p-select [options]="tiposVisa()" optionLabel="nombre" optionValue="id" formControlName="tipoDeVisa" placeholder="Seleccione..." />
          </div>
        </div>

        <div class="form-actions">
          <p-button label="Cancelar" icon="pi pi-times" severity="secondary" (click)="cancelar()" type="button" />
          <p-button label="Guardar Cambios" icon="pi pi-check" type="submit" [loading]="saving()" [disabled]="form.invalid" />
        </div>
      </form>

      @if (errorMsg()) {
        <div class="error-msg"><i class="pi pi-exclamation-triangle"></i> {{ errorMsg() }}</div>
      }
      @if (successMsg()) {
        <div class="success-msg"><i class="pi pi-check-circle"></i> {{ successMsg() }}</div>
      }
    }
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
    .form-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 2rem;
      margin-bottom: 1.5rem;
    }
    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .field label { font-size: 0.85rem; font-weight: 600; color: #555; }
    .field input, .field :host ::ng-deep .p-select, .field :host ::ng-deep .p-datepicker { width: 100%; }
    .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
    .loading-msg { padding: 2rem; text-align: center; color: #666; font-size: 0.95rem; }
    .error-msg {
      background: #ffebee; color: #c62828; padding: 0.75rem 1rem;
      border-radius: 6px; margin-top: 1rem; font-size: 0.9rem;
    }
    .success-msg {
      background: #e8f5e9; color: #2e7d32; padding: 0.75rem 1rem;
      border-radius: 6px; margin-top: 1rem; font-size: 0.9rem;
    }
  `]
})
export class TrabajadorEditarComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private trabajadoresService = inject(TrabajadoresService);
  private sharedService = inject(SharedService);

  generos = signal<CodigoReferencia[]>([]);
  estadosCiviles = signal<CodigoReferencia[]>([]);
  tiposVisa = signal<CodigoReferencia[]>([]);
  paises = signal<any[]>([]);
  loadingData = signal(true);
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  trabajadorId = 0;

  form = this.fb.group({
    primerNombre: ['', Validators.required],
    segundoNombre: [''],
    primerApellido: ['', Validators.required],
    segundoApellido: [''],
    codigoGenero: ['', Validators.required],
    codigoEstadoCivil: ['', Validators.required],
    fechaNacimiento: [null as Date | null, Validators.required],
    codigoPaisNacimiento: [''],
    codigoPaisCiudadania: [''],
    tipoDeVisa: [null as number | null]
  });

  ngOnInit() {
    this.trabajadorId = Number(this.route.snapshot.paramMap.get('id'));

    this.sharedService.getCodigosReferencia('GENERO').subscribe(d => this.generos.set(d));
    this.sharedService.getCodigosReferencia('ESTADO_CIVIL').subscribe(d => this.estadosCiviles.set(d));
    this.sharedService.getCodigosReferencia('TIPO_VISA').subscribe(d => this.tiposVisa.set(d));
    this.sharedService.getPaises().subscribe(d => this.paises.set(d));

    this.trabajadoresService.getById(this.trabajadorId).subscribe({
      next: (t: TrabajadorDetail) => {
        this.form.patchValue({
          primerNombre: t.primerNombre,
          segundoNombre: t.segundoNombre,
          primerApellido: t.primerApellido,
          segundoApellido: t.segundoApellido,
          codigoGenero: t.codigoGenero,
          codigoEstadoCivil: t.codigoEstadoCivil,
          fechaNacimiento: t.fechaNacimiento ? new Date(t.fechaNacimiento) : null,
          codigoPaisNacimiento: t.codigoPaisNacimiento,
          codigoPaisCiudadania: t.codigoPaisCiudadania,
          tipoDeVisa: t.tipoDeVisa
        });
        this.loadingData.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al cargar los datos del trabajador.');
        this.loadingData.set(false);
      }
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.errorMsg.set(null);
    this.successMsg.set(null);

    const val = this.form.getRawValue();
    const payload = {
      ...val,
      fechaNacimiento: val.fechaNacimiento ? (val.fechaNacimiento as Date).toISOString() : null
    };

    this.trabajadoresService.modificar(this.trabajadorId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.successMsg.set('Datos actualizados exitosamente.');
        setTimeout(() => this.router.navigate(['/trabajadores', this.trabajadorId]), 1500);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.errorMsg.set(err.error?.message || 'Error al guardar los cambios.');
      }
    });
  }

  cancelar() {
    this.router.navigate(['/trabajadores', this.trabajadorId]);
  }
}
