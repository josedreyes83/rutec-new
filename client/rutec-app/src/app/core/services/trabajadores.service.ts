import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';
import { PaginatedList, TrabajadorList, TrabajadorDetail } from '../models/rutec.models';

@Injectable({ providedIn: 'root' })
export class TrabajadoresService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  getAll(filtro: { cedula?: string; nombre?: string; idOrganizacion?: number; page?: number; pageSize?: number }) {
    let params = new HttpParams();
    if (filtro.cedula) params = params.set('cedula', filtro.cedula);
    if (filtro.nombre) params = params.set('nombre', filtro.nombre);
    if (filtro.idOrganizacion) params = params.set('idOrganizacion', filtro.idOrganizacion.toString());
    if (filtro.page) params = params.set('page', filtro.page.toString());
    if (filtro.pageSize) params = params.set('pageSize', filtro.pageSize.toString());
    return this.http.get<PaginatedList<TrabajadorList>>(`${this.api.baseUrl}/trabajadores`, { params });
  }

  getById(id: number) {
    return this.http.get<TrabajadorDetail>(`${this.api.baseUrl}/trabajadores/${id}`);
  }

  buscarPorCedula(cedula: string) {
    return this.http.get<TrabajadorDetail>(`${this.api.baseUrl}/trabajadores/buscar`, { params: { cedula } });
  }

  crear(dto: any) {
    return this.http.post<any>(`${this.api.baseUrl}/trabajadores`, dto);
  }

  modificar(id: number, dto: any) {
    return this.http.put(`${this.api.baseUrl}/trabajadores/${id}`, dto);
  }

  modificarDocumento(id: number, dto: any) {
    return this.http.put(`${this.api.baseUrl}/trabajadores/${id}/documento`, dto);
  }
}
