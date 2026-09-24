import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'cambiar-clave', loadComponent: () => import('./features/auth/cambiar-clave/cambiar-clave').then(m => m.CambiarClaveComponent) },

      // Trabajadores
      { path: 'trabajadores', loadComponent: () => import('./features/trabajadores/trabajador-list/trabajador-list').then(m => m.TrabajadorListComponent) },
      { path: 'trabajadores/buscar', loadComponent: () => import('./features/trabajadores/trabajador-buscar/trabajador-buscar').then(m => m.TrabajadorBuscarComponent) },
      { path: 'trabajadores/registrar', loadComponent: () => import('./features/trabajadores/trabajador-registro-wizard/trabajador-registro-wizard').then(m => m.TrabajadorRegistroWizardComponent) },
      { path: 'trabajadores/:id', loadComponent: () => import('./features/trabajadores/trabajador-resumen/trabajador-resumen').then(m => m.TrabajadorResumenComponent) },
      { path: 'trabajadores/:id/editar', loadComponent: () => import('./features/trabajadores/trabajador-editar/trabajador-editar').then(m => m.TrabajadorEditarComponent) },

      // Contratos
      { path: 'trabajadores/:id/contratos', loadComponent: () => import('./features/contratos/contrato-list/contrato-list').then(m => m.ContratoListComponent) },
      { path: 'trabajadores/:id/contratos/agregar', loadComponent: () => import('./features/contratos/contrato-form/contrato-form').then(m => m.ContratoFormComponent) },
      { path: 'trabajadores/:trabajadorId/contratos/:contratoId', loadComponent: () => import('./features/contratos/contrato-detalle/contrato-detalle').then(m => m.ContratoDetalleComponent) },
      { path: 'trabajadores/:trabajadorId/contratos/:contratoId/editar', loadComponent: () => import('./features/contratos/contrato-form/contrato-form').then(m => m.ContratoFormComponent) },
      { path: 'trabajadores/:trabajadorId/contratos/:contratoId/finalizar', loadComponent: () => import('./features/contratos/contrato-finalizar/contrato-finalizar').then(m => m.ContratoFinalizarComponent) },

      // Certificados
      { path: 'certificados', loadComponent: () => import('./features/certificados/certificado-list/certificado-list').then(m => m.CertificadoListComponent) },
      { path: 'certificados/generar/:contratoId', loadComponent: () => import('./features/certificados/certificado-generar/certificado-generar').then(m => m.CertificadoGenerarComponent) },

      // Calidad
      { path: 'calidad/empresas', loadComponent: () => import('./features/calidad/empresa-list/empresa-list').then(m => m.EmpresaListComponent) },
      { path: 'calidad/empresas/:id/contratos', loadComponent: () => import('./features/calidad/empresa-contratos/empresa-contratos').then(m => m.EmpresaContratosComponent) },
      { path: 'calidad/gestion', loadComponent: () => import('./features/calidad/contratos-gestion/contratos-gestion').then(m => m.ContratosGestionComponent) },
      { path: 'calidad/contrato-detalle/:contratoId', loadComponent: () => import('./features/calidad/contrato-verificacion-detalle/contrato-verificacion-detalle').then(m => m.ContratoVerificacionDetalleComponent) },
      { path: 'calidad/verificadores', loadComponent: () => import('./features/calidad/verificador-list/verificador-list').then(m => m.VerificadorListComponent) },
      { path: 'calidad/asignar-revisor', loadComponent: () => import('./features/calidad/asignar-revisor/asignar-revisor').then(m => m.AsignarRevisorComponent) },
      { path: 'calidad/verificadores/:usuario', loadComponent: () => import('./features/calidad/verificador-detalle/verificador-detalle').then(m => m.VerificadorDetalleComponent) },

      // Reportes
      { path: 'reportes', loadComponent: () => import('./features/reportes/reportes').then(m => m.ReportesComponent) },
      { path: 'reportes/dashboard', loadComponent: () => import('./features/reportes/reporte-dashboard').then(m => m.ReporteDashboardComponent) },
      { path: 'reportes/general', loadComponent: () => import('./features/reportes/reporte-general').then(m => m.ReporteGeneralComponent) },
      { path: 'reportes/genero', loadComponent: () => import('./features/reportes/reporte-genero').then(m => m.ReporteGeneroComponent) },
      { path: 'reportes/nacionalidad', loadComponent: () => import('./features/reportes/reporte-nacionalidad').then(m => m.ReporteNacionalidadComponent) },
      { path: 'reportes/nivel-academico', loadComponent: () => import('./features/reportes/reporte-nivel-academico').then(m => m.ReporteNivelAcademicoComponent) },
      { path: 'reportes/sector-economico', loadComponent: () => import('./features/reportes/reporte-sector-economico').then(m => m.ReporteSectorEconomicoComponent) },
      { path: 'reportes/zona', loadComponent: () => import('./features/reportes/reporte-zona').then(m => m.ReporteZonaComponent) },
      { path: 'reportes/ano-nacimiento', loadComponent: () => import('./features/reportes/reporte-ano-nacimiento').then(m => m.ReporteAnoNacimientoComponent) },
      { path: 'reportes/empresas-registradas', loadComponent: () => import('./features/reportes/reporte-empresas-registradas').then(m => m.ReporteEmpresasRegistradasComponent) },
      { path: 'reportes/cantidad-trabajadores', loadComponent: () => import('./features/reportes/reporte-cantidad-trabajadores').then(m => m.ReporteCantidadTrabajadoresComponent) },
      { path: 'reportes/rue-general', loadComponent: () => import('./features/reportes/reporte-rue-general').then(m => m.ReporteRueGeneralComponent) },
      { path: 'reportes/rue-dia', loadComponent: () => import('./features/reportes/reporte-rue-dia').then(m => m.ReporteRueDiaComponent) },
      { path: 'reportes/gestion-general', loadComponent: () => import('./features/reportes/reporte-gestion-general').then(m => m.ReporteGestionGeneralComponent) },
      { path: 'reportes/gestion-dia', loadComponent: () => import('./features/reportes/reporte-gestion-dia').then(m => m.ReporteGestionDiaComponent) },

      // Admin
      { path: 'admin/usuarios', loadComponent: () => import('./features/admin/usuario-list/usuario-list').then(m => m.UsuarioListComponent) },
      { path: 'admin/codigos-referencia', loadComponent: () => import('./features/admin/codigo-referencia-list/codigo-referencia-list').then(m => m.CodigoReferenciaListComponent) },
      { path: 'admin/empresas', loadComponent: () => import('./features/admin/empresa-rutec-list/empresa-rutec-list').then(m => m.EmpresaRutecListComponent) },
      { path: 'admin/modificar-fechas', loadComponent: () => import('./features/admin/modificar-fechas/modificar-fechas').then(m => m.ModificarFechasComponent) },
      { path: 'admin/eliminacion-masiva', loadComponent: () => import('./features/admin/eliminacion-masiva/eliminacion-masiva').then(m => m.EliminacionMasivaComponent) },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
