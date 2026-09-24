import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

export interface CertificadoInfo {
  contratoId: number;
  trabajadorId: number;
  nombreCompleto: string | null;
  numeroCedulaExtranjeria: string | null;
  paisNacimiento: string | null;
  denominacionContrato: string | null;
  cargoTrabajador: string | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  nombreOrganizacion: string | null;
  esComunidadAndina: boolean;
}

@Injectable({ providedIn: 'root' })
export class CertificadosService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  getByTrabajador(trabajadorId: number) {
    return this.http.get<CertificadoInfo[]>(`${this.api.baseUrl}/certificados/trabajador/${trabajadorId}`);
  }

  getInfoContrato(contratoId: number) {
    return this.http.get<CertificadoInfo>(`${this.api.baseUrl}/certificados/info/${contratoId}`);
  }

  descargarConstancia(contratoId: number) {
    return this.http.get(`${this.api.baseUrl}/certificados/generar/${contratoId}`, {
      responseType: 'blob'
    });
  }
}
