import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TrabajadoresService } from '../../../core/services/trabajadores.service';
import { SharedService } from '../../../core/services/shared.service';
import { CodigoReferencia } from '../../../core/models/rutec.models';
import { StepperModule } from 'primeng/stepper';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-trabajador-registro-wizard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    StepperModule, InputTextModule, SelectModule, DatePickerModule, ButtonModule
  ],
  template: `
    <div class="page-header">
      <h2>REGISTRO DE NUEVO TRABAJADOR EXTRANJERO</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-user-plus" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>FORMULARIO DE REGISTRO</strong><br>
        Complete todos los pasos para registrar un nuevo trabajador extranjero en el sistema.
      </div>
    </div>

    <p-stepper [linear]="true">
      <!-- Paso 1: Datos Personales -->
      <p-step [value]="1">
        <ng-template #content let-nextCallback="nextCallback">
          <div class="step-content">
            <h3>Datos Personales</h3>
            <div class="form-grid">
              <div class="field">
                <label>Primer Nombre *</label>
                <input pInputText [formControl]="form.controls.primerNombre" />
              </div>
              <div class="field">
                <label>Segundo Nombre</label>
                <input pInputText [formControl]="form.controls.segundoNombre" />
              </div>
              <div class="field">
                <label>Primer Apellido *</label>
                <input pInputText [formControl]="form.controls.primerApellido" />
              </div>
              <div class="field">
                <label>Segundo Apellido</label>
                <input pInputText [formControl]="form.controls.segundoApellido" />
              </div>
              <div class="field">
                <label>Genero *</label>
                <p-select [options]="generos()" optionLabel="nombre" optionValue="codigo" [formControl]="form.controls.codigoGenero" placeholder="Seleccione..." />
              </div>
              <div class="field">
                <label>Estado Civil *</label>
                <p-select [options]="estadosCiviles()" optionLabel="nombre" optionValue="codigo" [formControl]="form.controls.codigoEstadoCivil" placeholder="Seleccione..." />
              </div>
              <div class="field">
                <label>Fecha de Nacimiento *</label>
                <p-datepicker [formControl]="form.controls.fechaNacimiento" dateFormat="dd/mm/yy" [showIcon]="true" />
              </div>
            </div>
            <div class="step-actions">
              <p-button label="Siguiente" icon="pi pi-arrow-right" iconPos="right" (click)="nextCallback.emit()" [disabled]="!isStep1Valid()" />
            </div>
          </div>
        </ng-template>
      </p-step>

      <!-- Paso 2: Documento -->
      <p-step [value]="2">
        <ng-template #content let-prevCallback="prevCallback" let-nextCallback="nextCallback">
          <div class="step-content">
            <h3>Informacion del Documento</h3>
            <div class="form-grid">
              <div class="field">
                <label>Tipo de Documento *</label>
                <p-select [options]="tiposDocumento()" optionLabel="nombre" optionValue="codigo" [formControl]="form.controls.tipoDocumento" placeholder="Seleccione..." />
              </div>
              <div class="field">
                <label>Cedula de Extranjeria</label>
                <input pInputText [formControl]="form.controls.numeroCedulaExtranjeria" />
              </div>
              <div class="field">
                <label>Numero PEP</label>
                <input pInputText [formControl]="form.controls.numeroPep" />
              </div>
              <div class="field">
                <label>Numero Pasaporte</label>
                <input pInputText [formControl]="form.controls.numeroPasaporte" />
              </div>
            </div>
            <div class="step-actions">
              <p-button label="Anterior" icon="pi pi-arrow-left" severity="secondary" (click)="prevCallback.emit()" />
              <p-button label="Siguiente" icon="pi pi-arrow-right" iconPos="right" (click)="nextCallback.emit()" />
            </div>
          </div>
        </ng-template>
      </p-step>

      <!-- Paso 3: Origen -->
      <p-step [value]="3">
        <ng-template #content let-prevCallback="prevCallback" let-nextCallback="nextCallback">
          <div class="step-content">
            <h3>Pais de Origen</h3>
            <div class="form-grid">
              <div class="field">
                <label>Pais de Nacimiento *</label>
                <p-select [options]="paises()" optionLabel="nombre" optionValue="codigo" [formControl]="form.controls.codigoPaisNacimiento" placeholder="Seleccione..." [filter]="true" />
              </div>
              <div class="field">
                <label>Pais de Ciudadania *</label>
                <p-select [options]="paises()" optionLabel="nombre" optionValue="codigo" [formControl]="form.controls.codigoPaisCiudadania" placeholder="Seleccione..." [filter]="true" />
              </div>
              <div class="field">
                <label>Tipo de Visa</label>
                <p-select [options]="tiposVisa()" optionLabel="nombre" optionValue="id" [formControl]="form.controls.tipoDeVisa" placeholder="Seleccione..." />
              </div>
            </div>
            <div class="step-actions">
              <p-button label="Anterior" icon="pi pi-arrow-left" severity="secondary" (click)="prevCallback.emit()" />
              <p-button label="Siguiente" icon="pi pi-arrow-right" iconPos="right" (click)="nextCallback.emit()" />
            </div>
          </div>
        </ng-template>
      </p-step>

      <!-- Paso 4: Idiomas -->
      <p-step [value]="4">
        <ng-template #content let-prevCallback="prevCallback" let-nextCallback="nextCallback">
          <div class="step-content">
            <h3>Idiomas</h3>
            <p-button label="Agregar Idioma" icon="pi pi-plus" severity="success" size="small" (click)="agregarIdioma()" class="mb-btn" />
            @for (idioma of idiomasArray.controls; track $index; let i = $index) {
              <div class="idioma-row">
                <div class="field">
                  <label>Idioma</label>
                  <p-select [options]="idiomasRef()" optionLabel="nombre" optionValue="codigo" [formControl]="$any(idioma.get('idioma'))" placeholder="Seleccione..." />
                </div>
                <div class="field">
                  <label>Nivel Hablado</label>
                  <p-select [options]="nivelesIdioma()" optionLabel="nombre" optionValue="codigo" [formControl]="$any(idioma.get('nivelHablado'))" placeholder="Seleccione..." />
                </div>
                <div class="field">
                  <label>Nivel Escrito</label>
                  <p-select [options]="nivelesIdioma()" optionLabel="nombre" optionValue="codigo" [formControl]="$any(idioma.get('nivelEscrito'))" placeholder="Seleccione..." />
                </div>
                <div class="field">
                  <label>Nivel Leido</label>
                  <p-select [options]="nivelesIdioma()" optionLabel="nombre" optionValue="codigo" [formControl]="$any(idioma.get('nivelLeido'))" placeholder="Seleccione..." />
                </div>
                <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [text]="true" (click)="eliminarIdioma(i)" />
              </div>
            }
            @if (idiomasArray.length === 0) {
              <div class="empty-msg">No se han agregado idiomas.</div>
            }
            <div class="step-actions">
              <p-button label="Anterior" icon="pi pi-arrow-left" severity="secondary" (click)="prevCallback.emit()" />
              <p-button label="Siguiente" icon="pi pi-arrow-right" iconPos="right" (click)="nextCallback.emit()" />
            </div>
          </div>
        </ng-template>
      </p-step>

      <!-- Paso 5: Educacion -->
      <p-step [value]="5">
        <ng-template #content let-prevCallback="prevCallback">
          <div class="step-content">
            <h3>Niveles Educativos</h3>
            <p-button label="Agregar Nivel Educativo" icon="pi pi-plus" severity="success" size="small" (click)="agregarEducacion()" class="mb-btn" />
            @for (edu of educacionArray.controls; track $index; let i = $index) {
              <div class="edu-row">
                <div class="field">
                  <label>Nivel Educativo</label>
                  <p-select [options]="nivelesEducativos()" optionLabel="nombre" optionValue="codigo" [formControl]="$any(edu.get('nivelEducativo'))" placeholder="Seleccione..." />
                </div>
                <div class="field">
                  <label>Semestres Cursados</label>
                  <input pInputText type="number" [formControl]="$any(edu.get('semestresCursados'))" />
                </div>
                <div class="field">
                  <label>Obtuvo Titulo</label>
                  <p-select [options]="siNoOptions" optionLabel="label" optionValue="value" [formControl]="$any(edu.get('obtuvoTitulo'))" placeholder="Seleccione..." />
                </div>
                <div class="field">
                  <label>Titulo</label>
                  <input pInputText [formControl]="$any(edu.get('titulo'))" />
                </div>
                <p-button icon="pi pi-trash" severity="danger" [rounded]="true" [text]="true" (click)="eliminarEducacion(i)" />
              </div>
            }
            @if (educacionArray.length === 0) {
              <div class="empty-msg">No se han agregado niveles educativos.</div>
            }
            <div class="step-actions">
              <p-button label="Anterior" icon="pi pi-arrow-left" severity="secondary" (click)="prevCallback.emit()" />
              <p-button label="Registrar Trabajador" icon="pi pi-check" severity="success" (click)="registrar()" [loading]="submitting()" />
            </div>
          </div>
        </ng-template>
      </p-step>
    </p-stepper>

    @if (errorMsg()) {
      <div class="error-msg">
        <i class="pi pi-exclamation-triangle"></i> {{ errorMsg() }}
      </div>
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
    .step-content { padding: 1.5rem 0; }
    .step-content h3 { margin: 0 0 1rem 0; color: #37474f; font-size: 1rem; }
    .form-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 2rem;
      margin-bottom: 1.5rem;
    }
    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .field label { font-size: 0.85rem; font-weight: 600; color: #555; }
    .field input, .field :host ::ng-deep .p-select, .field :host ::ng-deep .p-datepicker { width: 100%; }
    .step-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }
    .idioma-row, .edu-row {
      display: flex; gap: 1rem; align-items: flex-end;
      padding: 0.75rem; margin-bottom: 0.5rem;
      background: #f8f9fa; border-radius: 6px;
    }
    .idioma-row .field, .edu-row .field { flex: 1; }
    .mb-btn { margin-bottom: 1rem; }
    .empty-msg { color: #90a4ae; font-size: 0.9rem; padding: 1rem; text-align: center; }
    .error-msg {
      background: #ffebee; color: #c62828; padding: 0.75rem 1rem;
      border-radius: 6px; margin-top: 1rem; font-size: 0.9rem;
    }
  `]
})
export class TrabajadorRegistroWizardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private trabajadoresService = inject(TrabajadoresService);
  private sharedService = inject(SharedService);

  generos = signal<CodigoReferencia[]>([]);
  estadosCiviles = signal<CodigoReferencia[]>([]);
  tiposDocumento = signal<CodigoReferencia[]>([]);
  tiposVisa = signal<CodigoReferencia[]>([]);
  paises = signal<any[]>([]);
  idiomasRef = signal<CodigoReferencia[]>([]);
  nivelesIdioma = signal<CodigoReferencia[]>([]);
  nivelesEducativos = signal<CodigoReferencia[]>([]);
  submitting = signal(false);
  errorMsg = signal<string | null>(null);

  siNoOptions = [
    { label: 'Si', value: 'S' },
    { label: 'No', value: 'N' }
  ];

  form = this.fb.group({
    primerNombre: ['', Validators.required],
    segundoNombre: [''],
    primerApellido: ['', Validators.required],
    segundoApellido: [''],
    codigoGenero: ['', Validators.required],
    codigoEstadoCivil: ['', Validators.required],
    fechaNacimiento: [null as Date | null, Validators.required],
    tipoDocumento: [''],
    numeroCedulaExtranjeria: [''],
    numeroPep: [''],
    numeroPasaporte: [''],
    codigoPaisNacimiento: ['', Validators.required],
    codigoPaisCiudadania: ['', Validators.required],
    tipoDeVisa: [null as number | null],
    idiomas: this.fb.array([]),
    nivelesEducativos: this.fb.array([])
  });

  get idiomasArray(): FormArray { return this.form.get('idiomas') as FormArray; }
  get educacionArray(): FormArray { return this.form.get('nivelesEducativos') as FormArray; }

  ngOnInit() {
    this.sharedService.getCodigosReferencia('GENERO').subscribe(d => this.generos.set(d));
    this.sharedService.getCodigosReferencia('ESTADO_CIVIL').subscribe(d => this.estadosCiviles.set(d));
    this.sharedService.getCodigosReferencia('TIPO_DOCUMENTO').subscribe(d => this.tiposDocumento.set(d));
    this.sharedService.getCodigosReferencia('TIPO_VISA').subscribe(d => this.tiposVisa.set(d));
    this.sharedService.getCodigosReferencia('IDIOMA').subscribe(d => this.idiomasRef.set(d));
    this.sharedService.getCodigosReferencia('NIVEL_IDIOMA').subscribe(d => this.nivelesIdioma.set(d));
    this.sharedService.getCodigosReferencia('NIVEL_EDUCATIVO').subscribe(d => this.nivelesEducativos.set(d));
    this.sharedService.getPaises().subscribe(d => this.paises.set(d));
  }

  isStep1Valid(): boolean {
    const c = this.form.controls;
    return !!(c.primerNombre.value && c.primerApellido.value && c.codigoGenero.value && c.codigoEstadoCivil.value && c.fechaNacimiento.value);
  }

  agregarIdioma() {
    this.idiomasArray.push(this.fb.group({
      idioma: [''],
      nivelHablado: [''],
      nivelEscrito: [''],
      nivelLeido: ['']
    }));
  }

  eliminarIdioma(i: number) { this.idiomasArray.removeAt(i); }

  agregarEducacion() {
    this.educacionArray.push(this.fb.group({
      nivelEducativo: [''],
      semestresCursados: [null],
      obtuvoTitulo: [''],
      titulo: ['']
    }));
  }

  eliminarEducacion(i: number) { this.educacionArray.removeAt(i); }

  registrar() {
    this.submitting.set(true);
    this.errorMsg.set(null);

    const val = this.form.getRawValue();
    const payload = {
      ...val,
      fechaNacimiento: val.fechaNacimiento ? (val.fechaNacimiento as Date).toISOString() : null
    };

    this.trabajadoresService.crear(payload).subscribe({
      next: (res: any) => {
        this.submitting.set(false);
        this.router.navigate(['/trabajadores', res.id]);
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.errorMsg.set(err.error?.message || 'Error al registrar el trabajador.');
      }
    });
  }
}
