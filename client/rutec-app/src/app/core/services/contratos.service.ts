import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { ContratoList, ContratoDetail } from '../models/rutec.models';

@Injectable({ providedIn: 'root' })
export class ContratosService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  getByTrabajador(trabajadorId: number) {
    return this.http.get<ContratoList[]>(`${this.api.baseUrl}/trabajadores/${trabajadorId}/contratos`);
  }

  getById(trabajadorId: number, id: number) {
    return this.http.get<ContratoDetail>(`${this.api.baseUrl}/trabajadores/${trabajadorId}/contratos/${id}`);
  }

  crear(trabajadorId: number, dto: any) {
    return this.http.post<any>(`${this.api.baseUrl}/trabajadores/${trabajadorId}/contratos`, dto);
  }

  modificar(trabajadorId: number, id: number, dto: any) {
    return this.http.put(`${this.api.baseUrl}/trabajadores/${trabajadorId}/contratos/${id}`, dto);
  }

  finalizar(trabajadorId: number, id: number) {
    return this.http.put(`${this.api.baseUrl}/trabajadores/${trabajadorId}/contratos/${id}/finalizar`, {});
  }

  eliminar(trabajadorId: number, id: number, motivoEliminado: string) {
    return this.http.delete(`${this.api.baseUrl}/trabajadores/${trabajadorId}/contratos/${id}`, {
      body: { motivoEliminado }
    });
  }
}
