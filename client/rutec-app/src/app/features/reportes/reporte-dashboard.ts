import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from 'primeng/chart';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { ReportesService } from '../../core/services/reportes.service';
import { SharedService } from '../../core/services/shared.service';

@Component({
  selector: 'app-reporte-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CardModule, ProgressSpinnerModule, ChartModule, SelectButtonModule, DatePickerModule, SelectModule, ButtonModule],
  template: `
    <div class="banner">
      <div class="banner-title">Registro estadistico RUTEC</div>
      <div class="banner-sub">Estadisticas de los contratos almacenados en el aplicativo.</div>
    </div>

    <!-- Tabs -->
    <div class="tabs-row">
      <p-selectButton [options]="tabOptions" [(ngModel)]="selectedTab" optionLabel="label" optionValue="value" />
    </div>

    @if (selectedTab === 'rue') {
      <!-- RUE Filters -->
      <div class="filter-row">
        <div class="filter-item">
          <label>Fecha Desde</label>
          <p-datepicker [(ngModel)]="rueFechaDesde" dateFormat="dd/mm/yy" [showIcon]="true" />
        </div>
        <div class="filter-item">
          <label>Fecha Hasta</label>
          <p-datepicker [(ngModel)]="rueFechaHasta" dateFormat="dd/mm/yy" [showIcon]="true" />
        </div>
        <div class="filter-item filter-btn">
          <p-button label="Consulta" icon="pi pi-search" (onClick)="loadRueData()" [loading]="loadingRue()" />
        </div>
      </div>

      <h3 class="page-title">Tablero de control RUE</h3>

      @if (loadingRue()) {
        <div style="text-align:center; padding:3rem">
          <p-progressSpinner />
        </div>
      } @else {
        <!-- Row 1: KPIs + Line chart -->
        <div class="row row-top">
          <div class="kpi-col">
            <p-card styleClass="kpi-card blue">
              <ng-template #title>Empresas Registradas</ng-template>
              <span class="kpi-value">{{ rueData().empresasRegistradas | number }}</span>
              <div class="kpi-sub">Todas (acumulado)</div>
              <div class="kpi-sub">{{ rueData().totalEmpresas | number }}</div>
            </p-card>
            <p-card styleClass="kpi-card green">
              <ng-template #title>Solicitudes Realizadas</ng-template>
              <span class="kpi-value">{{ rueData().solicitudesRealizadas | number }}</span>
              <div class="kpi-sub">Total Realizadas</div>
              <div class="kpi-sub">{{ rueData().totalSolicitudes | number }}</div>
            </p-card>
          </div>
          <div class="chart-col">
            <p-card>
              <ng-template #title>Registros de empresas</ng-template>
              <p-chart type="line" [data]="rueRegistrosChart" [options]="lineOptions" height="280px" />
            </p-card>
          </div>
        </div>

        <!-- Row 2: Departamentos + Municipios -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>Departamentos (Top 7)</ng-template>
            <p-chart type="bar" [data]="rueDepartamentosChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>Municipios (Top 7)</ng-template>
            <p-chart type="bar" [data]="rueMunicipiosChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 3: CIUO Nivel 1 + CIUO Nivel 2 -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>CIUO Nivel 1 (Top 7)</ng-template>
            <p-chart type="pie" [data]="rueCiuoNivel1Chart" [options]="pieOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>CIUO Nivel 2 (Top 7)</ng-template>
            <p-chart type="bar" [data]="rueCiuoNivel2Chart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 4: CIUO Nivel 3 -->
        <div class="row row-1col">
          <p-card>
            <ng-template #title>CIUO Nivel 3 (Top 7)</ng-template>
            <p-chart type="bar" [data]="rueCiuoNivel3Chart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>
      }
    } @else {
      <!-- RUTEC Filters -->
      <div class="filter-row">
        <div class="filter-item">
          <label>Fecha Desde</label>
          <p-datepicker [(ngModel)]="fechaDesde" dateFormat="dd/mm/yy" [showIcon]="true" />
        </div>
        <div class="filter-item">
          <label>Fecha Hasta</label>
          <p-datepicker [(ngModel)]="fechaHasta" dateFormat="dd/mm/yy" [showIcon]="true" />
        </div>
        <div class="filter-item">
          <label>Paises</label>
          <p-select [options]="paisesOptions" [(ngModel)]="selectedPais" optionLabel="nombre" optionValue="codigo" placeholder="Todos" [filter]="true" [style]="{'min-width':'200px'}" />
        </div>
        <div class="filter-item filter-btn">
          <p-button label="Consulta" icon="pi pi-search" (onClick)="loadData()" [loading]="loading()" />
        </div>
      </div>

      <h3 class="page-title">Tablero de control RUTEC</h3>

      @if (loading()) {
        <div style="text-align:center; padding:3rem">
          <p-progressSpinner />
        </div>
      } @else {
        <!-- Row 1: KPIs Trabajadores + Line chart -->
        <div class="row row-top">
          <div class="kpi-col">
            <p-card styleClass="kpi-card blue">
              <ng-template #title>Trabajadores Registrados</ng-template>
              <span class="kpi-value">{{ data().trabajadoresRegistrados | number }}</span>
              <div class="kpi-sub">Todos</div>
              <div class="kpi-sub">{{ data().totalTrabajadores | number }}</div>
            </p-card>
            <p-card styleClass="kpi-card green">
              <ng-template #title>Trabajadores Activos</ng-template>
              <span class="kpi-value">{{ data().trabajadoresActivos | number }}</span>
            </p-card>
          </div>
          <div class="chart-col">
            <p-card>
              <ng-template #title>Registros de trabajadores</ng-template>
              <p-chart type="line" [data]="registrosTrabajadoresChart" [options]="lineOptions" height="280px" />
            </p-card>
          </div>
        </div>

        <!-- Row 2: Pie charts (Genero + Estado Civil) -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>Trabajadores por Genero</ng-template>
            <p-chart type="pie" [data]="generoChart" [options]="pieOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>Estado Civil</ng-template>
            <p-chart type="pie" [data]="estadoCivilChart" [options]="pieOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 3: Pie (Tipo Documento) + Bar (Visas) -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>Tipo Documento</ng-template>
            <p-chart type="pie" [data]="tipoDocChart" [options]="pieOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>Tipos de Visas (Top 5)</ng-template>
            <p-chart type="bar" [data]="visaChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 4: Bar charts (Pais nacimiento + Nacionalidad) -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>Trabajadores segun pais de nacimiento (Top 7)</ng-template>
            <p-chart type="bar" [data]="paisNacimientoChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>Trabajadores segun pais de nacionalidad (Top 7)</ng-template>
            <p-chart type="bar" [data]="nacionalidadChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 5: KPIs Empresas/Contratos + Line chart -->
        <div class="row row-top">
          <div class="kpi-col">
            <p-card styleClass="kpi-card orange">
              <ng-template #title>Empresas Registradas</ng-template>
              <span class="kpi-value">{{ data().empresasRegistradas | number }}</span>
              <div class="kpi-sub">Todas</div>
              <div class="kpi-sub">{{ data().totalOrganizaciones | number }}</div>
            </p-card>
            <p-card styleClass="kpi-card purple">
              <ng-template #title>Total de Contratos</ng-template>
              <span class="kpi-value">{{ data().totalContratos | number }}</span>
              <div class="kpi-sub-row">
                <span class="sub-created">Creados: {{ data().contratosCreados | number }}</span>
                <span class="sub-total">Total Creados: {{ data().totalContratosCreados | number }}</span>
                <span class="sub-active">Activos: {{ data().contratosActivos | number }}</span>
                <span class="sub-finished">Finalizados: {{ data().contratosFinalizados | number }}</span>
                <span class="sub-total">Total Finalizados: {{ data().totalContratosFinalizados | number }}</span>
              </div>
            </p-card>
          </div>
          <div class="chart-col">
            <p-card>
              <ng-template #title>Registros de contratos</ng-template>
              <p-chart type="line" [data]="contratosChart" [options]="lineOptions" height="280px" />
            </p-card>
          </div>
        </div>

        <!-- Row 6: Contratos Inicios vs Culminacion (dual line) -->
        <div class="row row-1col">
          <p-card>
            <ng-template #title>Contratos: Inicios vs Culminacion</ng-template>
            <p-chart type="line" [data]="contratosIniciosVsCulminacionChart" [options]="dualLineOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 7: Eliminados por mes + Eliminados por motivo -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>Contratos Eliminados por mes</ng-template>
            <p-chart type="line" [data]="contratosEliminadosMesChart" [options]="lineOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>Contratos Eliminados</ng-template>
            <p-chart type="pie" [data]="contratosEliminadosMotivoChart" [options]="pieOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 8: Sectores contratacion + Tipos de Contratos -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>Sectores mayor contratacion (Top 9)</ng-template>
            <p-chart type="bar" [data]="sectoresChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>Tipos de Contratos</ng-template>
            <p-chart type="pie" [data]="tiposContratoChart" [options]="pieOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 9: CIUO Nivel 1 + CIUO Nivel 2 -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>CIUO Nivel 1</ng-template>
            <p-chart type="pie" [data]="ciuoNivel1Chart" [options]="pieOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>CIUO Nivel 2</ng-template>
            <p-chart type="bar" [data]="ciuoNivel2Chart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 10: CIUO Nivel 3 -->
        <div class="row row-1col">
          <p-card>
            <ng-template #title>CIUO Nivel 3</ng-template>
            <p-chart type="bar" [data]="ciuoNivel3Chart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 11: Pensiones + Riesgos Laborales -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>Pensiones (Top 7)</ng-template>
            <p-chart type="bar" [data]="pensionesChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>Riesgos Laborales (Top 7)</ng-template>
            <p-chart type="bar" [data]="riesgosChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 12: Salud + Caja de Compensacion -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>Salud (Top 7)</ng-template>
            <p-chart type="bar" [data]="saludChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>Caja de Compensacion (Top 7)</ng-template>
            <p-chart type="bar" [data]="cajaChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>

        <!-- Row 13: Departamentos + Municipios -->
        <div class="row row-2col">
          <p-card>
            <ng-template #title>Departamentos (Top 7)</ng-template>
            <p-chart type="bar" [data]="departamentosChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
          <p-card>
            <ng-template #title>Municipios (Top 7)</ng-template>
            <p-chart type="bar" [data]="municipiosChart" [options]="horizontalBarOptions" height="300px" />
          </p-card>
        </div>
      }
    }

    <hr>
    <a routerLink="/reportes" class="back-link">Regresar a reportes</a>
  `,
  styles: [`
    .banner {
      background: #1565c0; color: white; padding: 0.75rem 1.25rem;
      border-radius: 8px; font-weight: 700;
      margin-bottom: 1rem; text-align: center;
    }
    .banner-title { font-size: 1.1rem; }
    .banner-sub { font-size: 0.85rem; font-weight: 400; margin-top: 0.25rem; opacity: 0.9; }
    .tabs-row { margin-bottom: 1rem; display: flex; justify-content: center; }
    .filter-row {
      display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;
      margin-bottom: 1.25rem; padding: 0.75rem 1rem;
      background: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0;
    }
    .filter-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .filter-item label { font-size: 0.8rem; font-weight: 600; color: #555; }
    .filter-btn { justify-content: flex-end; }
    .page-title { font-size: 1.1rem; font-weight: 700; color: #333; margin-bottom: 1.25rem; text-align: center; }
    .row { display: grid; gap: 1rem; margin-bottom: 1.25rem; }
    .row-top { grid-template-columns: 300px 1fr; }
    .row-2col { grid-template-columns: 1fr 1fr; }
    .row-1col { grid-template-columns: 1fr; }
    .kpi-col { display: flex; flex-direction: column; gap: 1rem; }
    .chart-col { min-width: 0; }
    :host ::ng-deep .kpi-card { text-align: center; }
    :host ::ng-deep .kpi-card.blue .p-card { border-left: 4px solid #42A5F5; }
    :host ::ng-deep .kpi-card.green .p-card { border-left: 4px solid #66BB6A; }
    :host ::ng-deep .kpi-card.orange .p-card { border-left: 4px solid #FFA726; }
    :host ::ng-deep .kpi-card.purple .p-card { border-left: 4px solid #AB47BC; }
    .kpi-value { font-size: 2rem; font-weight: 700; color: #1565c0; }
    .kpi-sub { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
    .kpi-sub-row { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.78rem; margin-top: 0.35rem; }
    .sub-created { color: #1565c0; }
    .sub-total { color: #333; font-weight: 600; }
    .sub-active { color: #2e7d32; }
    .sub-finished { color: #e65100; }
    .sub-deleted { color: #c62828; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 1.5rem 0 1rem; }
    .back-link {
      color: #37474f; text-decoration: none; font-size: 0.85rem;
      border: 1px solid #ccc; padding: 0.4rem 1rem; border-radius: 4px;
    }
    .back-link:hover { background: #f5f5f5; }
    @media (max-width: 768px) {
      .row-top, .row-2col { grid-template-columns: 1fr; }
      .filter-row { flex-direction: column; }
    }
  `]
})
export class ReporteDashboardComponent implements OnInit {
  private reportesService = inject(ReportesService);
  private sharedService = inject(SharedService);
  loading = signal(true);
  data = signal<any>({});
  loadingRue = signal(false);
  rueData = signal<any>({});

  // Tabs
  tabOptions = [
    { label: 'Tablero de Control RUTEC', value: 'rutec' },
    { label: 'Tablero de control RUE', value: 'rue' }
  ];
  selectedTab = 'rutec';

  // Filters RUTEC
  fechaDesde: Date = new Date(2020, 0, 1);
  fechaHasta: Date = new Date();
  paisesOptions: { codigo: string; nombre: string }[] = [];
  selectedPais: string = '';

  // Filters RUE
  rueFechaDesde: Date = new Date(2020, 0, 1);
  rueFechaHasta: Date = new Date();

  // Chart data
  generoChart: any;
  estadoCivilChart: any;
  tipoDocChart: any;
  visaChart: any;
  paisNacimientoChart: any;
  nacionalidadChart: any;
  registrosTrabajadoresChart: any;
  contratosChart: any;
  contratosIniciosVsCulminacionChart: any;
  contratosEliminadosMesChart: any;
  contratosEliminadosMotivoChart: any;
  sectoresChart: any;
  tiposContratoChart: any;
  ciuoNivel1Chart: any;
  ciuoNivel2Chart: any;
  ciuoNivel3Chart: any;
  pensionesChart: any;
  riesgosChart: any;
  saludChart: any;
  cajaChart: any;
  departamentosChart: any;
  municipiosChart: any;

  // RUE chart data
  rueRegistrosChart: any;
  rueDepartamentosChart: any;
  rueMunicipiosChart: any;
  rueCiuoNivel1Chart: any;
  rueCiuoNivel2Chart: any;
  rueCiuoNivel3Chart: any;

  // Chart options
  pieOptions = {
    plugins: { legend: { position: 'bottom' as const } },
    maintainAspectRatio: false
  };

  horizontalBarOptions = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    scales: { x: { beginAtZero: true } }
  };

  lineOptions = {
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { maxTicksLimit: 12 } },
      y: { beginAtZero: true }
    }
  };

  dualLineOptions = {
    plugins: { legend: { position: 'bottom' as const } },
    maintainAspectRatio: false,
    scales: {
      x: { ticks: { maxTicksLimit: 12 } },
      y: { beginAtZero: true }
    }
  };

  private readonly COLORS = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#26C6DA', '#8D6E63', '#78909C'];

  ngOnInit() {
    this.sharedService.getPaises().subscribe({
      next: (paises) => {
        this.paisesOptions = [{ codigo: '', nombre: 'Todos' }, ...paises];
      }
    });
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    const params: any = {};
    if (this.fechaDesde) {
      params.fechaDesde = this.formatDate(this.fechaDesde);
    }
    if (this.fechaHasta) {
      params.fechaHasta = this.formatDate(this.fechaHasta);
    }
    if (this.selectedPais && this.selectedPais !== '') {
      params.pais = this.selectedPais;
    }

    this.reportesService.getDashboard(params).subscribe({
      next: (res) => {
        this.data.set(res);
        this.buildCharts(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadRueData() {
    this.loadingRue.set(true);
    const params: any = {};
    if (this.rueFechaDesde) {
      params.fechaDesde = this.formatDate(this.rueFechaDesde);
    }
    if (this.rueFechaHasta) {
      params.fechaHasta = this.formatDate(this.rueFechaHasta);
    }

    this.reportesService.getDashboardRue(params).subscribe({
      next: (res) => {
        this.rueData.set(res);
        this.buildRueCharts(res);
        this.loadingRue.set(false);
      },
      error: () => this.loadingRue.set(false)
    });
  }

  private buildRueCharts(d: any) {
    this.rueRegistrosChart = this.buildLineData(d.registrosPorMes || []);
    this.rueDepartamentosChart = this.buildBarData(d.departamentosTop7 || []);
    this.rueMunicipiosChart = this.buildBarData(d.municipiosTop7 || []);
    this.rueCiuoNivel1Chart = this.buildPieData(d.ciuoNivel1 || []);
    this.rueCiuoNivel2Chart = this.buildBarData(d.ciuoNivel2 || []);
    this.rueCiuoNivel3Chart = this.buildBarData(d.ciuoNivel3 || []);
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private buildCharts(d: any) {
    this.generoChart = this.buildPieData(d.porGenero);
    this.estadoCivilChart = this.buildPieData(d.porEstadoCivil);
    this.tipoDocChart = this.buildPieData(d.porTipoDocumento);

    this.visaChart = this.buildBarData(d.porTipoVisa);
    this.paisNacimientoChart = this.buildBarData(d.porPaisNacimiento);
    this.nacionalidadChart = this.buildBarData(d.porNacionalidad);

    this.registrosTrabajadoresChart = this.buildLineData(d.registrosPorMes);
    this.contratosChart = this.buildLineData(d.contratosPorMes);

    // Dual line: Inicios vs Culminacion
    this.contratosIniciosVsCulminacionChart = this.buildDualLineData(
      d.contratosIniciosPorMes || [], d.contratosFinalizacionPorMes || []
    );

    this.contratosEliminadosMesChart = this.buildLineData(d.contratosEliminadosPorMes || []);
    this.contratosEliminadosMotivoChart = this.buildPieData(d.contratosEliminadosPorMotivo || []);
    this.sectoresChart = this.buildBarData(d.sectoresContratacion || []);
    this.tiposContratoChart = this.buildPieData(d.tiposContrato || []);
    this.ciuoNivel1Chart = this.buildPieData(d.ciuoNivel1 || []);
    this.ciuoNivel2Chart = this.buildBarData(d.ciuoNivel2 || []);
    this.ciuoNivel3Chart = this.buildBarData(d.ciuoNivel3 || []);
    this.pensionesChart = this.buildBarData(d.pensionesTop7 || []);
    this.riesgosChart = this.buildBarData(d.riesgosTop7 || []);
    this.saludChart = this.buildBarData(d.saludTop7 || []);
    this.cajaChart = this.buildBarData(d.cajaTop7 || []);
    this.departamentosChart = this.buildBarData(d.departamentosTop7 || []);
    this.municipiosChart = this.buildBarData(d.municipiosTop7 || []);
  }

  private buildPieData(items: { label: string; value: number }[]) {
    return {
      labels: items.map(i => i.label),
      datasets: [{
        data: items.map(i => i.value),
        backgroundColor: this.COLORS.slice(0, items.length)
      }]
    };
  }

  private buildBarData(items: { label: string; value: number }[]) {
    return {
      labels: items.map(i => i.label),
      datasets: [{
        label: 'Cantidad',
        data: items.map(i => i.value),
        backgroundColor: '#42A5F5'
      }]
    };
  }

  private buildDualLineData(inicios: { label: string; value: number }[], culminacion: { label: string; value: number }[]) {
    const allLabels = new Set([...inicios.map(i => i.label), ...culminacion.map(i => i.label)]);
    const sortedLabels = Array.from(allLabels).sort((a, b) => {
      const [ma, ya] = a.split('/');
      const [mb, yb] = b.split('/');
      return (+ya - +yb) || (+ma - +mb);
    });
    const iniciosMap = new Map(inicios.map(i => [i.label, i.value]));
    const culminacionMap = new Map(culminacion.map(i => [i.label, i.value]));
    return {
      labels: sortedLabels,
      datasets: [
        {
          label: 'Inicios',
          data: sortedLabels.map(l => iniciosMap.get(l) || 0),
          borderColor: '#42A5F5',
          fill: false,
          tension: 0.3
        },
        {
          label: 'Culminacion',
          data: sortedLabels.map(l => culminacionMap.get(l) || 0),
          borderColor: '#EF5350',
          fill: false,
          tension: 0.3
        }
      ]
    };
  }

  private buildLineData(items: { label: string; value: number }[]) {
    return {
      labels: items.map(i => i.label),
      datasets: [{
        label: 'Registros',
        data: items.map(i => i.value),
        borderColor: '#42A5F5',
        fill: true,
        backgroundColor: 'rgba(66,165,245,0.1)',
        tension: 0.3
      }]
    };
  }
}
