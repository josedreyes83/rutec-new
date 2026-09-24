import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { CodigoReferencia } from '../models/rutec.models';

@Injectable({ providedIn: 'root' })
export class SharedService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  getDepartamentos() {
    return this.http.get<{ codigo: string; nombre: string }[]>(`${this.api.baseUrl}/shared/departamentos`);
  }

  getMunicipios(depto?: string) {
    const params = depto ? `?depto=${depto}` : '';
    return this.http.get<{ codigo: string; nombre: string; departamento: number }[]>(`${this.api.baseUrl}/shared/municipios${params}`);
  }

  getPaises() {
    return this.http.get<{ codigo: string; nombre: string }[]>(`${this.api.baseUrl}/shared/paises`);
  }

  getCodigosReferencia(grupo?: string) {
    const params = grupo ? `?grupo=${grupo}` : '';
    return this.http.get<CodigoReferencia[]>(`${this.api.baseUrl}/shared/codigos-referencia${params}`);
  }

  getOcupacionesLaborales(nivel?: number, padre?: string) {
    const params = new URLSearchParams();
    if (nivel != null) params.set('nivel', nivel.toString());
    if (padre) params.set('padre', padre);
    const qs = params.toString() ? `?${params}` : '';
    return this.http.get<{ codigoOcupacionLaboral: string; nombreOcupacionLaboral: string; nivelOcupacionLaboral: number }[]>(`${this.api.baseUrl}/shared/ocupaciones-laborales${qs}`);
  }

  getEntidadesSeguridadSocial(tipo?: string) {
    const params = tipo ? `?tipo=${tipo}` : '';
    return this.http.get<{ id: number; razonSocial: string; codigoTipoSeguridadSocial: string }[]>(`${this.api.baseUrl}/shared/entidades-seguridad-social${params}`);
  }

  getMiOrganizacion() {
    return this.http.get<DatosOrganizacion>(`${this.api.baseUrl}/shared/mi-organizacion`);
  }

  getDatosOrganizacion(idOrganizacion: number) {
    return this.http.get<DatosOrganizacion>(`${this.api.baseUrl}/shared/organizacion/${idOrganizacion}`);
  }
}

export interface DatosOrganizacion {
  nombreOrganizacion: string | null;
  actividadEconomica: string | null;
  numeroDocumento: string | null;
  representante: {
    nombreCompleto: string | null;
    documentoIdentificacion: string | null;
  } | null;
}
