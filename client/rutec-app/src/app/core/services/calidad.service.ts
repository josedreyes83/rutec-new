import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

export interface EmpresaVerificacion {
  idOrganizacion: number;
  nombreOrganizacion: string | null;
  totalContratos: number;
  contratosPendientes: number;
  contratosAprobados: number;
}

export interface ContratoVerificacion {
  contratoId: number;
  trabajadorId: number;
  nombreTrabajador: string | null;
  cedulaExtranjeria: string | null;
  cargoTrabajador: string | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  aclaracion: string | null;
  motivoAclaracion: string | null;
  observacion: string | null;
  usuarioVerificador: string | null;
  fechaVerificacion: string | null;
  alertaDias: boolean;
  alertaModificado: boolean;
}

@Injectable({ providedIn: 'root' })
export class CalidadService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  getEmpresas() {
    return this.http.get<EmpresaVerificacion[]>(`${this.api.baseUrl}/calidad/empresas`);
  }

  getEmpresasPendientes() {
    return this.http.get<EmpresaVerificacion[]>(`${this.api.baseUrl}/calidad/empresas/pendientes`);
  }

  getEmpresasAprobadas() {
    return this.http.get<EmpresaVerificacion[]>(`${this.api.baseUrl}/calidad/empresas/aprobadas`);
  }

  getContratosEmpresa(idOrganizacion: number) {
    return this.http.get<ContratoVerificacion[]>(`${this.api.baseUrl}/calidad/empresas/${idOrganizacion}/contratos`);
  }

  asignarVerificador(contratoId: number, usuarioVerificador: string) {
    return this.http.post(`${this.api.baseUrl}/calidad/contratos/${contratoId}/verificador`, { usuarioVerificador });
  }

  registrarVerificacion(contratoId: number, aclaracion: string, motivoAclaracion?: string, observacion?: string) {
    return this.http.post(`${this.api.baseUrl}/calidad/contratos/${contratoId}/verificacion`, {
      aclaracion, motivoAclaracion, observacion
    });
  }

  getVerificadores() {
    return this.http.get<VerificadorGestion[]>(`${this.api.baseUrl}/calidad/verificadores`);
  }

  getContratoDetalle(contratoId: number) {
    return this.http.get<any>(`${this.api.baseUrl}/calidad/contrato-detalle/${contratoId}`);
  }

  getMotivosAclaracion() {
    return this.http.get<{ label: string; value: string }[]>(`${this.api.baseUrl}/calidad/motivos-aclaracion`);
  }

  getContratosGestion(estado: string, verificador?: string) {
    let url = `${this.api.baseUrl}/calidad/contratos-gestion?estado=${estado}`;
    if (verificador) url += `&verificador=${verificador}`;
    return this.http.get<ContratoGestion[]>(url);
  }

  getContratosDisponiblesCount() {
    return this.http.get<{ count: number }>(`${this.api.baseUrl}/calidad/contratos-disponibles-count`);
  }

  getUsuariosAdmin() {
    return this.http.get<{ userName: string }[]>(`${this.api.baseUrl}/calidad/usuarios-admin`);
  }

  asignarContratoUnico(usuario: string, contratoId: number) {
    return this.http.post<{ ok: boolean }>(
      `${this.api.baseUrl}/calidad/asignar-contrato-unico`,
      { usuario, contratoId }
    );
  }

  asignarContratosMasivo(usuario: string, cantidad: number) {
    return this.http.post<{ asignados: number }>(
      `${this.api.baseUrl}/calidad/asignar-contratos-masivo`,
      { usuario, cantidad }
    );
  }
}

export interface VerificadorGestion {
  usuarioRegistro: string;
  registrosTotales: number;
  registrosProcesados: number;
  registrosPendientes: number;
}

export interface ContratoGestion {
  contratoId: number;
  nombreOrganizacion: string | null;
  docTrabajador: string | null;
  nombreTrabajador: string | null;
  cantidadIdiomas: number;
  cantidadEstudios: number;
  aclaracion: string | null;
  observacion: string | null;
  fechaGestion: string | null;
  motivosTexto: string | null;
  alertaDias: boolean;
  alertaModificado: boolean;
}
