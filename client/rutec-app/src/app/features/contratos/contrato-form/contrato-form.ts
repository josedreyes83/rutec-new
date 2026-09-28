import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContratosService } from '../../../core/services/contratos.service';
import { SharedService } from '../../../core/services/shared.service';
import { GRUPOS } from '../../../core/constants/grupos-codigo-referencia';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-contrato-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    InputTextModule, SelectModule, DatePickerModule, TextareaModule, ButtonModule
  ],
  template: `
    <div class="page-header">
      <h2>{{ editMode() ? 'EDITAR CONTRATO' : 'AGREGAR CONTRATO' }}</h2>
    </div>

    <div class="info-bar">
      <i class="pi pi-file-edit" style="font-size:1.5rem; color:#1565c0"></i>
      <div>
        <strong>{{ editMode() ? 'MODIFICAR INFORMACION DEL CONTRATO' : 'REGISTRAR NUEVO CONTRATO' }}</strong><br>
        Diligencie todos los campos requeridos.
      </div>
    </div>

    <form [formGroup]="form" (ngSubmit)="guardar()" class="form-grid">
      <div class="field">
        <label>Denominacion del contrato *</label>
        <input pInputText formControlName="denominacionContrato" />
      </div>

      <div class="field">
        <label>Tipo de contrato *</label>
        <p-select
          formControlName="tipoContratoTrabajador"
          [options]="tiposContrato()"
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccione tipo"
        />
      </div>

      <div class="field">
        <label>Cargo del trabajador *</label>
        <input pInputText formControlName="cargoTrabajador" />
      </div>

      <div class="field">
        <label>Profesion</label>
        <input pInputText formControlName="profesion" />
      </div>

      <div class="field">
        <label>Vigencia desde *</label>
        <p-datepicker formControlName="vigenciaDesde" dateFormat="dd/mm/yy" [showIcon]="true" />
      </div>

      <div class="field">
        <label>Vigencia hasta *</label>
        <p-datepicker formControlName="vigenciaHasta" dateFormat="dd/mm/yy" [showIcon]="true" />
      </div>

      <div class="field">
        <label>Departamento *</label>
        <p-select
          formControlName="codigoDepto"
          [options]="departamentos()"
          optionLabel="nombre"
          optionValue="codigo"
          placeholder="Seleccione departamento"
          (onChange)="onDepartamentoChange()"
          [filter]="true"
        />
      </div>

      <div class="field">
        <label>Municipio *</label>
        <p-select
          formControlName="codigoMpio"
          [options]="municipios()"
          optionLabel="nombre"
          optionValue="codigo"
          placeholder="Seleccione municipio"
          [filter]="true"
        />
      </div>

      <div class="field full-width">
        <label>Descripcion del contrato</label>
        <textarea pTextarea formControlName="descripcionContrato" [rows]="3"></textarea>
      </div>

      <div class="section-title full-width">Ocupaciones Laborales</div>

      <div class="field">
        <label>Gran grupo</label>
        <p-select
          formControlName="ocupacionNivel1"
          [options]="ocupaciones1()"
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccione"
          (onChange)="onOcupacion1Change()"
          [filter]="true"
        />
      </div>

      <div class="field">
        <label>Subgrupo</label>
        <p-select
          formControlName="ocupacionNivel2"
          [options]="ocupaciones2()"
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccione"
          (onChange)="onOcupacion2Change()"
          [filter]="true"
        />
      </div>

      <div class="field">
        <label>Grupo unitario</label>
        <p-select
          formControlName="ocupacionNivel3"
          [options]="ocupaciones3()"
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccione"
          [filter]="true"
        />
      </div>

      <div class="section-title full-width">Entidades de Seguridad Social</div>

      <div class="field">
        <label>Pension</label>
        <p-select
          formControlName="entidadPension"
          [options]="entidadesPension()"
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccione"
          [filter]="true"
        />
      </div>

      <div class="field">
        <label>Salud</label>
        <p-select
          formControlName="entidadSalud"
          [options]="entidadesSalud()"
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccione"
          [filter]="true"
        />
      </div>

      <div class="field">
        <label>Riesgos laborales</label>
        <p-select
          formControlName="entidadRiesgos"
          [options]="entidadesRiesgos()"
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccione"
          [filter]="true"
        />
      </div>

      <div class="field">
        <label>Caja de compensacion</label>
        <p-select
          formControlName="entidadCaja"
          [options]="entidadesCaja()"
          optionLabel="nombre"
          optionValue="id"
          placeholder="Seleccione"
          [filter]="true"
        />
      </div>

      <div class="form-actions full-width">
        <p-button label="Guardar" icon="pi pi-save" type="submit" [disabled]="form.invalid || saving()" />
        <p-button label="Cancelar" icon="pi pi-times" severity="secondary" [outlined]="true" (click)="cancelar()" />
      </div>
    </form>
  `,
  styles: [`
    .page-header { margin-bottom: 1rem; }
    .page-header h2 { color: #333; font-size: 1rem; font-weight: 600; }
    .info-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 2px solid #1565c0;
      border-radius: 8px;
      padding: 0.75rem 1.25rem;
      margin-bottom: 1.25rem;
      background: white;
      font-size: 0.85rem;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.5rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .field label { font-size: 0.85rem; font-weight: 600; color: #37474f; }
    .field input, .field textarea { width: 100%; }
    .field :host ::ng-deep .p-select, .field :host ::ng-deep .p-datepicker { width: 100%; }
    .full-width { grid-column: 1 / -1; }
    .section-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: #1565c0;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 0.5rem;
      margin-top: 0.5rem;
    }
    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
  `]
})
export class ContratoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contratosService = inject(ContratosService);
  private sharedService = inject(SharedService);

  editMode = signal(false);
  saving = signal(false);
  trabajadorId = 0;
  contratoId = 0;

  // Dropdown data
  tiposContrato = signal<any[]>([]);
  departamentos = signal<any[]>([]);
  municipios = signal<any[]>([]);
  ocupaciones1 = signal<any[]>([]);
  ocupaciones2 = signal<any[]>([]);
  ocupaciones3 = signal<any[]>([]);
  entidadesPension = signal<any[]>([]);
  entidadesSalud = signal<any[]>([]);
  entidadesRiesgos = signal<any[]>([]);
  entidadesCaja = signal<any[]>([]);

  form: FormGroup = this.fb.group({
    denominacionContrato: ['', Validators.required],
    // Guarda el ID_COD_REFERENCIA_NUM de CODTIPOCONTRATO, no el codigo corto.
    tipoContratoTrabajador: [null as number | null, Validators.required],
    cargoTrabajador: ['', Validators.required],
    profesion: [''],
    vigenciaDesde: [null as Date | null, Validators.required],
    vigenciaHasta: [null as Date | null, Validators.required],
    codigoDepto: ['', Validators.required],
    codigoMpio: ['', Validators.required],
    descripcionContrato: [''],
    ocupacionNivel1: [null as number | null],
    ocupacionNivel2: [null as number | null],
    ocupacionNivel3: [null as number | null],
    entidadPension: [null as number | null],
    entidadSalud: [null as number | null],
    entidadRiesgos: [null as number | null],
    entidadCaja: [null as number | null],
  });

  ngOnInit() {
    this.trabajadorId = Number(this.route.snapshot.paramMap.get('trabajadorId') || this.route.snapshot.paramMap.get('id'));
    this.contratoId = Number(this.route.snapshot.paramMap.get('contratoId') || 0);

    if (this.contratoId) {
      this.editMode.set(true);
      this.cargarContrato();
    }

    this.cargarDropdowns();
  }

  private cargarDropdowns() {
    this.sharedService.getCodigosReferencia(GRUPOS.TIPO_CONTRATO).subscribe(data => this.tiposContrato.set(data));
    this.sharedService.getDepartamentos().subscribe(data => this.departamentos.set(data));
    this.sharedService.getOcupacionesLaborales(1).subscribe(data => this.ocupaciones1.set(data));
    this.sharedService.getEntidadesSeguridadSocial('PENSION').subscribe(data => this.entidadesPension.set(data));
    this.sharedService.getEntidadesSeguridadSocial('SALUD').subscribe(data => this.entidadesSalud.set(data));
    this.sharedService.getEntidadesSeguridadSocial('RIESGOS').subscribe(data => this.entidadesRiesgos.set(data));
    this.sharedService.getEntidadesSeguridadSocial('CAJA').subscribe(data => this.entidadesCaja.set(data));
  }

  private cargarContrato() {
    this.contratosService.getById(this.trabajadorId, this.contratoId).subscribe(contrato => {
      this.form.patchValue({
        denominacionContrato: contrato.denominacionContrato,
        tipoContratoTrabajador: contrato.tipoContratoTrabajador != null
          ? Number(contrato.tipoContratoTrabajador) : null,
        cargoTrabajador: contrato.cargoTrabajador,
        profesion: contrato.profesion,
        vigenciaDesde: contrato.vigenciaDesde ? new Date(contrato.vigenciaDesde) : null,
        vigenciaHasta: contrato.vigenciaHasta ? new Date(contrato.vigenciaHasta) : null,
        codigoDepto: contrato.codigoDepto,
        codigoMpio: contrato.codigoMpio,
        descripcionContrato: contrato.descripcionContrato,
      });

      if (contrato.codigoDepto) {
        this.sharedService.getMunicipios(contrato.codigoDepto).subscribe(data => this.municipios.set(data));
      }
    });
  }

  onDepartamentoChange() {
    const depto = this.form.get('codigoDepto')?.value;
    this.form.patchValue({ codigoMpio: '' });
    this.municipios.set([]);
    if (depto) {
      this.sharedService.getMunicipios(depto).subscribe(data => this.municipios.set(data));
    }
  }

  onOcupacion1Change() {
    const id = this.form.get('ocupacionNivel1')?.value;
    this.form.patchValue({ ocupacionNivel2: null, ocupacionNivel3: null });
    this.ocupaciones2.set([]);
    this.ocupaciones3.set([]);
    if (id) {
      this.sharedService.getOcupacionesLaborales(2, id).subscribe(data => this.ocupaciones2.set(data));
    }
  }

  onOcupacion2Change() {
    const id = this.form.get('ocupacionNivel2')?.value;
    this.form.patchValue({ ocupacionNivel3: null });
    this.ocupaciones3.set([]);
    if (id) {
      this.sharedService.getOcupacionesLaborales(3, id).subscribe(data => this.ocupaciones3.set(data));
    }
  }

  guardar() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const val = this.form.value;
    const data = {
      ...val,
      tipoContratoTrabajador: val.tipoContratoTrabajador != null
        ? String(val.tipoContratoTrabajador) : null
    };

    const obs = this.editMode()
      ? this.contratosService.modificar(this.trabajadorId, this.contratoId, data)
      : this.contratosService.crear(this.trabajadorId, data);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos']);
      },
      error: () => this.saving.set(false)
    });
  }

  cancelar() {
    if (this.editMode()) {
      this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos', this.contratoId]);
    } else {
      this.router.navigate(['/trabajadores', this.trabajadorId, 'contratos']);
    }
  }
}
