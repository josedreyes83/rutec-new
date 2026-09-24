import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // URL relativa: el SPA compilado lo sirve el propio RUTEC.WebApi (mismo origen).
  // En dev, proxy.conf.json redirige /api al backend en el puerto 5142.
  readonly baseUrl = '/api';
}
