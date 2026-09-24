import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h3 class="page-title">REGISTRO UNICO DE TRABAJADORES EXTRANJEROS EN COLOMBIA - RUTEC</h3>

    <div class="info-bar">
      <i class="pi pi-id-card" style="font-size:1.5rem; color:#1565c0"></i>
      <div><strong>Reportes y estadisticas del RUTEC</strong></div>
    </div>

    <h4 class="section-title">Reportes</h4>

    <!-- Tablero de Control -->
    <div class="report-section red">
      <div class="section-header-text">🌐 TABLERO DE CONTROL RUTEC</div>
      <a routerLink="/reportes/dashboard" class="report-link">∑ TABLERO DE CONTROL</a>
      <a routerLink="/reportes/general" class="report-link">∑ REPORTE GENERAL</a>
    </div>

    <!-- RUTEC - DATOS DE TODAS LAS NACIONALIDADES -->
    <div class="report-section blue">
      <div class="section-header-text">📋 RUTEC - DATOS DE TODAS LAS NACIONALIDADES</div>
      <a routerLink="/reportes/empresas-registradas" class="report-link">∑ REPORTE CANTIDAD EMPRESAS REGISTRADAS "con informacion de trabajadores extranjeros"</a>
      <a routerLink="/reportes/cantidad-trabajadores" class="report-link">∑ TRABAJADORES REGISTRADOS EN RUTEC "Agrupados por numero de documento reportado"</a>
      <a routerLink="/reportes/genero" class="report-link">∑ REPORTE POR GENERO</a>
      <a routerLink="/reportes/ano-nacimiento" class="report-link">∑ AÑO DE NACIMIENTO</a>
      <a routerLink="/reportes/zona" class="report-link">∑ REPORTE CONTRATOS MUNICIPIO "Agrupados por municipio de ejecucion del contrato"</a>
      <a routerLink="/reportes/nivel-academico" class="report-link">∑ NIVEL ACADEMICO "Agrupados por municipio de ejecucion del contrato"</a>
      <a routerLink="/reportes/sector-economico" class="report-link">∑ SECTORES ECONOMICOS "por contratos"</a>
      <a routerLink="/reportes/nacionalidad" class="report-link">∑ NACIONALIDAD TRABAJADORES EXTRANJEROS</a>
    </div>

    <!-- RUE -->> RUTEC -->
    <div class="report-section yellow">
      <div class="section-header-text">📋 RUE --&gt;&gt; RUTEC</div>
      <a routerLink="/reportes/rue-general" class="report-link">∑ REPORTE SOLICITUDES</a>
      <a routerLink="/reportes/rue-dia" class="report-link">∑ REPORTE SOLICITUDES DIARIO</a>
      <a routerLink="/reportes/gestion-general" class="report-link">∑ RUTEC - GESTION</a>
      <a routerLink="/reportes/gestion-dia" class="report-link">∑ GESTION DIA</a>
    </div>

    <hr>
    <a routerLink="/dashboard" class="back-link">Regresar</a>
  `,
  styles: [`
    .page-title { font-size: 1rem; font-weight: 700; color: #333; margin-bottom: 1rem; }
    .info-bar {
      display: flex; align-items: center; gap: 1rem;
      border: 2px solid #26c6da; border-radius: 8px;
      padding: 0.75rem 1.25rem; margin-bottom: 1.25rem;
      background: white; font-size: 0.85rem;
    }
    .section-title { font-weight: 700; font-size: 0.95rem; color: #333; margin-bottom: 1rem; }
    .report-section {
      border: 2px solid #e0e0e0; border-radius: 8px;
      padding: 1rem 1.25rem; margin-bottom: 1rem;
      background: white;
    }
    .report-section.red { border-color: #ef9a9a; }
    .report-section.blue { border-color: #90caf9; }
    .report-section.yellow { border-color: #fff176; }
    .section-header-text {
      font-weight: 700; font-size: 0.9rem; color: #333;
      margin-bottom: 0.75rem; padding-bottom: 0.5rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .report-link {
      display: block; color: #1565c0; text-decoration: none;
      font-size: 0.85rem; padding: 0.4rem 0;
      transition: color 0.15s;
    }
    .report-link:hover { color: #0d47a1; text-decoration: underline; }
    hr { border: none; border-top: 1px solid #e0e0e0; margin: 1rem 0; }
    .back-link {
      color: #37474f; text-decoration: none; font-size: 0.85rem;
      border: 1px solid #ccc; padding: 0.4rem 1rem; border-radius: 4px;
    }
    .back-link:hover { background: #f5f5f5; }
  `]
})
export class ReportesComponent {}
