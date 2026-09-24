import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

export interface ReporteGeneral {
  totalOrganizaciones: number;
  totalTrabajadores: number;
  totalContratos: number;
}

export interface ReporteItem {
  categoria: string | null;
  cantidad: number;
}

export interface ReporteEmpresaRegistrada {
  idOrganizacion: number;
  nombreOrganizacion: string | null;
  cantidadTrabajadores: number;
  fechaPrimerRegistro: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  getGeneral() { return this.http.get<ReporteGeneral>(`${this.api.baseUrl}/reportes/general`); }
  getPorGenero() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/genero`); }
  getPorNacionalidad() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/nacionalidad`); }
  getPorNivelAcademico() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/nivel-academico`); }
  getPorSectorEconomico() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/sector-economico`); }
  getPorZona() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/zona`); }
  getPorAnoNacimiento() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/ano-nacimiento`); }
  getEmpresasRegistradas() { return this.http.get<ReporteEmpresaRegistrada[]>(`${this.api.baseUrl}/reportes/empresas-registradas`); }
  getCantidadTrabajadores() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/cantidad-trabajadores`); }
  getRueGeneral() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/rue-general`); }
  getRueDia() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/rue-dia`); }
  getGestionGeneral() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/gestion-general`); }
  getGestionDia() { return this.http.get<ReporteItem[]>(`${this.api.baseUrl}/reportes/gestion-dia`); }

  getDashboard(params?: { fechaDesde?: string; fechaHasta?: string; pais?: string }) {
    const qp = new URLSearchParams();
    if (params?.fechaDesde) qp.set('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) qp.set('fechaHasta', params.fechaHasta);
    if (params?.pais && params.pais !== 'Todos') qp.set('pais', params.pais);
    const qs = qp.toString() ? `?${qp}` : '';
    return this.http.get<any>(`${this.api.baseUrl}/reportes/dashboard${qs}`);
  }

  getDashboardRue(params?: { fechaDesde?: string; fechaHasta?: string }) {
    const qp = new URLSearchParams();
    if (params?.fechaDesde) qp.set('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) qp.set('fechaHasta', params.fechaHasta);
    const qs = qp.toString() ? `?${qp}` : '';
    return this.http.get<any>(`${this.api.baseUrl}/reportes/dashboard-rue${qs}`);
  }

  exportarExcel(tipo: string) {
    return this.http.get(`${this.api.baseUrl}/reportes/exportar-excel`, {
      params: { tipo },
      responseType: 'blob'
    });
  }
}
