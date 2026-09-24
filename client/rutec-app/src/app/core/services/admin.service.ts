import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

export interface UsuarioList {
  id: string;
  userName: string | null;
  email: string | null;
  nombreCompleto: string | null;
  activo: boolean;
  ultimoAcceso: string | null;
  roles: string[];
}

export interface CodigoReferenciaAdmin {
  id: number;
  codigo: string | null;
  nombre: string | null;
  grupo: string | null;
  dominio: string | null;
  ordenPresentacion: number | null;
}

export interface EmpresaRutec {
  idOrganizacion: number;
  cantidadTrabajadores: number;
  cantidadContratos: number;
  fechaPrimerRegistro: string | null;
}

export interface ContratoAdmin {
  id: number;
  trabajadorId: number;
  nombreTrabajador: string | null;
  cedulaExtranjeria: string | null;
  cargo: string | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  eliminado: boolean;
}

export interface EliminacionMasivaResult {
  eliminados: number;
  errores: number;
  detalles: string[] | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  getUsuarios() { return this.http.get<UsuarioList[]>(`${this.api.baseUrl}/admin/usuarios`); }
  getUsuario(id: string) { return this.http.get<UsuarioList>(`${this.api.baseUrl}/admin/usuarios/${id}`); }

  getCodigosReferencia(grupo?: string) {
    const params = grupo ? `?grupo=${grupo}` : '';
    return this.http.get<CodigoReferenciaAdmin[]>(`${this.api.baseUrl}/admin/codigos-referencia${params}`);
  }

  crearCodigoReferencia(dto: { codigo: string; nombre: string; grupo: string; dominio?: string; ordenPresentacion?: number }) {
    return this.http.post<{ id: number }>(`${this.api.baseUrl}/admin/codigos-referencia`, dto);
  }

  modificarCodigoReferencia(id: number, dto: { codigo?: string; nombre?: string; dominio?: string; ordenPresentacion?: number }) {
    return this.http.put(`${this.api.baseUrl}/admin/codigos-referencia/${id}`, dto);
  }

  eliminarCodigoReferencia(id: number) {
    return this.http.delete(`${this.api.baseUrl}/admin/codigos-referencia/${id}`);
  }

  getEmpresas() { return this.http.get<EmpresaRutec[]>(`${this.api.baseUrl}/admin/empresas`); }

  getContratosEmpresa(idOrganizacion: number) {
    return this.http.get<ContratoAdmin[]>(`${this.api.baseUrl}/admin/empresas/${idOrganizacion}/contratos`);
  }

  getContrato(id: number) {
    return this.http.get<ContratoAdmin>(`${this.api.baseUrl}/admin/contratos/${id}`);
  }

  getContratoFull(id: number) {
    return this.http.get<ContratoFullModificar>(`${this.api.baseUrl}/admin/contratos/${id}/full`);
  }

  modificarFechasContrato(id: number, vigenciaDesde: string, vigenciaHasta: string) {
    return this.http.put(`${this.api.baseUrl}/admin/contratos/${id}/fechas`, { vigenciaDesde, vigenciaHasta });
  }

  eliminarMasivo(trabajadorIds: number[]) {
    return this.http.delete<EliminacionMasivaResult>(`${this.api.baseUrl}/admin/registros/masivo`, {
      body: { trabajadorIds }
    });
  }
}

export interface ContratoFullModificar {
  id: number;
  docOrganizacion: string | null;
  nombreOrganizacion: string | null;
  tipoDocumentoTrabajador: string | null;
  numeroDocumentoTrabajador: string | null;
  nombreTrabajador: string | null;
  denominacionContrato: string | null;
  cargoTrabajador: string | null;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
}
