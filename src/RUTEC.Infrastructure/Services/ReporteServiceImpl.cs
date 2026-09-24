using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;
using RUTEC.Infrastructure.Data;

namespace RUTEC.Infrastructure.Services;

public class ReporteServiceImpl : IReporteService
{
    private readonly RutecDbContext _db;
    private readonly RueReadOnlyDbContext _rueDb;

    public ReporteServiceImpl(RutecDbContext db, RueReadOnlyDbContext rueDb)
    {
        _db = db;
        _rueDb = rueDb;
    }

    public async Task<ReporteGeneralDto> GetGeneralAsync()
    {
        var totalOrganizaciones = await _db.Contratos
            .Where(c => !c.Eliminado && c.IdOrganizacion != null)
            .Select(c => c.IdOrganizacion)
            .Distinct()
            .CountAsync();

        var totalTrabajadores = await _db.MigrantesTrabajadores.CountAsync();

        var totalContratos = await _db.Contratos
            .Where(c => !c.Eliminado)
            .CountAsync();

        return new ReporteGeneralDto(totalOrganizaciones, totalTrabajadores, totalContratos);
    }

    public async Task<List<ReporteItemDto>> GetPorGeneroAsync()
    {
        var codigos = await _db.CodigosReferencia
            .Where(c => c.Grupo == "CODGENERO")
            .ToListAsync();

        var grupos = await _db.MigrantesTrabajadores
            .GroupBy(t => t.CodigoGenero)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto(
            codigos.FirstOrDefault(c => c.Codigo == g.Codigo)?.Nombre ?? g.Codigo ?? "Sin especificar",
            g.Cantidad
        )).OrderByDescending(r => r.Cantidad).ToList();
    }

    public async Task<List<ReporteItemDto>> GetPorNacionalidadAsync()
    {
        var paises = await _db.Paises.ToListAsync();

        var grupos = await _db.MigrantesTrabajadores
            .GroupBy(t => t.CodigoPaisNacimiento)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto(
            paises.FirstOrDefault(p => p.Codigo == g.Codigo)?.Nombre ?? g.Codigo ?? "Sin especificar",
            g.Cantidad
        )).OrderByDescending(r => r.Cantidad).ToList();
    }

    public async Task<List<ReporteItemDto>> GetPorNivelAcademicoAsync()
    {
        var codigos = await _db.CodigosReferencia
            .Where(c => c.Grupo == "TIPONIV_EDUCATIVO")
            .ToListAsync();

        var grupos = await _db.ContratosNivelesEducativos
            .GroupBy(n => n.CodigoNivelEducativo)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto(
            codigos.FirstOrDefault(c => c.Codigo == g.Codigo.ToString())?.Nombre ?? g.Codigo?.ToString() ?? "Sin especificar",
            g.Cantidad
        )).OrderByDescending(r => r.Cantidad).ToList();
    }

    public async Task<List<ReporteItemDto>> GetPorSectorEconomicoAsync()
    {
        var ocupaciones = await _db.OcupacionesLaborales
            .Where(o => o.NivelOcupacionLaboral == 1)
            .ToListAsync();

        var contratos = await _db.Contratos
            .Where(c => !c.Eliminado && c.CodigoOcupacionLaboral1 != null && c.CodigoOcupacionLaboral1.Length >= 2)
            .Select(c => c.CodigoOcupacionLaboral1!.Substring(0, 2))
            .ToListAsync();

        var grupos = contratos
            .GroupBy(sector => sector)
            .Select(g => new
            {
                Sector = g.Key,
                Cantidad = g.Count()
            });

        return grupos.Select(g => new ReporteItemDto(
            ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == g.Sector)?.NombreOcupacionLaboral ?? $"Sector {g.Sector}",
            g.Cantidad
        )).OrderByDescending(r => r.Cantidad).ToList();
    }

    public async Task<List<ReporteItemDto>> GetPorZonaAsync()
    {
        var deptos = await _db.Departamentos.ToListAsync();

        var grupos = await _db.Contratos
            .Where(c => !c.Eliminado)
            .GroupBy(c => c.CodigoDepto)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto(
            deptos.FirstOrDefault(d => d.Codigo == g.Codigo)?.Nombre ?? g.Codigo ?? "Sin especificar",
            g.Cantidad
        )).OrderByDescending(r => r.Cantidad).ToList();
    }

    public async Task<List<ReporteItemDto>> GetPorAnoNacimientoAsync()
    {
        var grupos = await _db.MigrantesTrabajadores
            .Where(t => t.FechaNacimiento != null)
            .GroupBy(t => t.FechaNacimiento!.Value.Year)
            .Select(g => new { Ano = g.Key, Cantidad = g.Count() })
            .OrderBy(g => g.Ano)
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto(g.Ano.ToString(), g.Cantidad)).ToList();
    }

    public async Task<List<ReporteEmpresaRegistradaDto>> GetEmpresasRegistradasAsync()
    {
        var resultado = await _db.Contratos
            .Where(c => !c.Eliminado && c.IdOrganizacion != null)
            .GroupBy(c => c.IdOrganizacion)
            .Select(g => new ReporteEmpresaRegistradaDto(
                g.Key!.Value,
                null,
                g.Select(c => c.IdMigranteTrabajador).Distinct().Count(),
                g.Min(c => c.FechaRegistro)
            ))
            .OrderByDescending(e => e.CantidadTrabajadores)
            .ToListAsync();

        return resultado;
    }

    public async Task<List<ReporteItemDto>> GetCantidadTrabajadoresAsync()
    {
        var grupos = await _db.MigrantesTrabajadores
            .Where(t => t.FechaRegistro != null)
            .GroupBy(t => new { t.FechaRegistro!.Value.Year, t.FechaRegistro!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Cantidad = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto($"{g.Year}-{g.Month:D2}", g.Cantidad)).ToList();
    }

    public async Task<List<ReporteItemDto>> GetRueGeneralAsync()
    {
        var grupos = await _db.Contratos
            .Where(c => !c.Eliminado && c.FechaRegistro != null)
            .GroupBy(c => new { c.FechaRegistro!.Value.Year, c.FechaRegistro!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Cantidad = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto($"{g.Year}-{g.Month:D2}", g.Cantidad)).ToList();
    }

    public async Task<List<ReporteItemDto>> GetRueDiaAsync()
    {
        var grupos = await _db.Contratos
            .Where(c => !c.Eliminado && c.FechaRegistro != null)
            .GroupBy(c => c.FechaRegistro!.Value.Date)
            .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
            .OrderByDescending(g => g.Fecha)
            .Take(90)
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto(g.Fecha.ToString("yyyy-MM-dd"), g.Cantidad)).ToList();
    }

    public async Task<List<ReporteItemDto>> GetGestionGeneralAsync()
    {
        var grupos = await _db.VerificacionesContratos
            .Where(v => v.FechaRegistro != null)
            .GroupBy(v => new { v.FechaRegistro!.Value.Year, v.FechaRegistro!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Cantidad = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto($"{g.Year}-{g.Month:D2}", g.Cantidad)).ToList();
    }

    public async Task<List<ReporteItemDto>> GetGestionDiaAsync()
    {
        var grupos = await _db.VerificacionesContratos
            .Where(v => v.FechaRegistro != null)
            .GroupBy(v => v.FechaRegistro!.Value.Date)
            .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
            .OrderByDescending(g => g.Fecha)
            .Take(90)
            .ToListAsync();

        return grupos.Select(g => new ReporteItemDto(g.Fecha.ToString("yyyy-MM-dd"), g.Cantidad)).ToList();
    }

    public async Task<object> GetDashboardAsync(DateTime? fechaDesde = null, DateTime? fechaHasta = null, string? pais = null)
    {
        var desde = fechaDesde ?? new DateTime(2020, 1, 1);
        var hasta = fechaHasta ?? DateTime.Now;

        // Base queryable for trabajadores filtered by pais (CODIGO_PAIS_CIUDADANIA per legacy)
        var trabajadoresQuery = _db.MigrantesTrabajadores.AsQueryable();
        if (!string.IsNullOrEmpty(pais) && pais != "Todos" && pais != "*")
            trabajadoresQuery = trabajadoresQuery.Where(t => t.CodigoPaisCiudadania == pais);

        // Base queryable for contratos joined with trabajador, filtered by pais on ciudadania
        var contratosBaseQuery = _db.Contratos.AsQueryable();
        if (!string.IsNullOrEmpty(pais) && pais != "Todos" && pais != "*")
            contratosBaseQuery = contratosBaseQuery.Where(c => c.MigranteTrabajador != null && c.MigranteTrabajador.CodigoPaisCiudadania == pais);

        // KPIs - Trabajadores
        // 1. trabajadoresRegistrados: workers registered IN the date range
        var trabajadoresRegistrados = await trabajadoresQuery
            .Where(t => t.FechaRegistro >= desde && t.FechaRegistro <= hasta)
            .CountAsync();

        // 2. totalTrabajadores: all workers registered UP TO the end date
        var totalTrabajadores = await trabajadoresQuery
            .Where(t => t.FechaRegistro <= hasta)
            .CountAsync();

        // 8. contratosActivos: contracts active at the end date (started before/on and end after)
        var contratosActivos = await contratosBaseQuery
            .Where(c => !c.Eliminado && c.VigenciaDesde <= hasta && c.VigenciaHasta > hasta)
            .CountAsync();

        // 3. trabajadoresActivos = same as contratosActivos (legacy behavior)
        var trabajadoresActivos = contratosActivos;

        // KPIs - Empresas/Contratos
        // 4. empresasRegistradas: distinct orgs with contracts created in date range
        var empresasRegistradas = await contratosBaseQuery
            .Where(c => !c.Eliminado && c.FechaRegistro >= desde && c.FechaRegistro <= hasta && c.IdOrganizacion != null)
            .Select(c => c.IdOrganizacion)
            .Distinct()
            .CountAsync();

        // 5. totalOrganizaciones: all distinct orgs up to end date
        var totalOrganizaciones = await contratosBaseQuery
            .Where(c => !c.Eliminado && c.FechaRegistro <= hasta && c.IdOrganizacion != null)
            .Select(c => c.IdOrganizacion)
            .Distinct()
            .CountAsync();

        // 6. contratosCreados: contracts created IN the range, not eliminated
        var contratosCreados = await contratosBaseQuery
            .Where(c => !c.Eliminado && c.FechaRegistro >= desde && c.FechaRegistro <= hasta)
            .CountAsync();

        // 7. totalContratosCreados: all contracts created up to end date, not eliminated
        var totalContratosCreados = await contratosBaseQuery
            .Where(c => !c.Eliminado && c.FechaRegistro <= hasta)
            .CountAsync();

        // 9. contratosFinalizados: contracts that ended in the range
        var contratosFinalizados = await contratosBaseQuery
            .Where(c => !c.Eliminado && c.VigenciaHasta >= desde && c.VigenciaHasta <= hasta)
            .CountAsync();

        // 10. totalContratosFinalizados: all contracts finalized up to end date
        var totalContratosFinalizados = await contratosBaseQuery
            .Where(c => !c.Eliminado && c.VigenciaHasta <= hasta)
            .CountAsync();

        // 11. contratosEliminados: all eliminated contracts (no date filter per legacy)
        var contratosEliminados = await contratosBaseQuery
            .Where(c => c.Eliminado)
            .CountAsync();

        // totalContratos kept for backward compat (same as totalContratosCreados)
        var totalContratos = totalContratosCreados;

        // Lookup tables
        var codigos = await _db.CodigosReferencia.ToListAsync();
        var paises = await _db.Paises.ToListAsync();

        string ResolveCodigo(string? codigo, string grupo)
        {
            if (string.IsNullOrEmpty(codigo)) return "Sin especificar";
            // Try by Codigo (string match)
            var match = codigos.FirstOrDefault(c => c.Grupo == grupo && c.Codigo == codigo);
            if (match != null) return match.Nombre ?? codigo;
            // Try by Id (numeric match)
            if (long.TryParse(codigo, out var id))
            {
                match = codigos.FirstOrDefault(c => c.Grupo == grupo && c.Id == id);
                if (match != null) return match.Nombre ?? codigo;
            }
            return codigo;
        }

        string ResolveCodigoById(long? id, string grupo)
        {
            if (!id.HasValue) return "Sin especificar";
            var match = codigos.FirstOrDefault(c => c.Grupo == grupo && c.Id == id.Value);
            if (match != null) return match.Nombre ?? id.Value.ToString();
            match = codigos.FirstOrDefault(c => c.Grupo == grupo && c.Codigo == id.Value.ToString());
            return match?.Nombre ?? id.Value.ToString();
        }

        // Por Genero
        var gruposGenero = await trabajadoresQuery
            .GroupBy(t => t.CodigoGenero)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();
        var porGenero = gruposGenero
            .Select(g => new { label = ResolveCodigo(g.Codigo, "CODGENERO"), value = g.Cantidad })
            .OrderByDescending(x => x.value).ToList();

        // Por Estado Civil — CodigoEstadoCivil stores ID_COD_REFERENCIA_NUM as string
        var gruposEstadoCivil = await trabajadoresQuery
            .GroupBy(t => t.CodigoEstadoCivil)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();
        var porEstadoCivil = gruposEstadoCivil
            .Select(g => new { label = ResolveCodigo(g.Codigo, "TIPOESTADOCIVIL"), value = g.Cantidad })
            .OrderByDescending(x => x.value).ToList();

        // Por Tipo Documento
        var gruposTipoDoc = await trabajadoresQuery
            .GroupBy(t => t.TipoDocumento)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();
        var porTipoDocumento = gruposTipoDoc
            .Select(g => new { label = ResolveCodigo(g.Codigo, "CODTIPODOCID"), value = g.Cantidad })
            .OrderByDescending(x => x.value).ToList();

        // Por Nacionalidad (CodigoPaisCiudadania) top 7
        var gruposNacionalidad = await trabajadoresQuery
            .GroupBy(t => t.CodigoPaisCiudadania)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();
        var porNacionalidad = gruposNacionalidad
            .Select(g => new
            {
                label = paises.FirstOrDefault(p => p.Codigo == g.Codigo)?.Nombre ?? g.Codigo ?? "Sin especificar",
                value = g.Cantidad
            })
            .OrderByDescending(x => x.value).Take(7).ToList();

        // Por Pais Nacimiento (CodigoPaisNacimiento) top 7
        var gruposPaisNac = await trabajadoresQuery
            .GroupBy(t => t.CodigoPaisNacimiento)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();
        var porPaisNacimiento = gruposPaisNac
            .Select(g => new
            {
                label = paises.FirstOrDefault(p => p.Codigo == g.Codigo)?.Nombre ?? g.Codigo ?? "Sin especificar",
                value = g.Cantidad
            })
            .OrderByDescending(x => x.value).Take(7).ToList();

        // Por Tipo Visa (top 5) — TipoDeVisa stores ID_COD_REFERENCIA_NUM; 0/null = NO REPORTA
        var gruposVisa = await trabajadoresQuery
            .GroupBy(t => t.TipoDeVisa)
            .Select(g => new { Codigo = g.Key, Cantidad = g.Count() })
            .ToListAsync();
        var porTipoVisa = gruposVisa
            .Select(g => new {
                label = (g.Codigo == null || g.Codigo == 0)
                    ? "NO REPORTA"
                    : ResolveCodigoById(g.Codigo, "TIPOVISA"),
                value = g.Cantidad
            })
            .OrderByDescending(x => x.value)
            .Take(5).ToList();

        // Registros por Mes (trabajadores)
        var gruposMesTrabajadores = await trabajadoresQuery
            .Where(t => t.FechaRegistro != null)
            .GroupBy(t => new { t.FechaRegistro!.Value.Year, t.FechaRegistro!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Cantidad = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();
        var registrosPorMes = gruposMesTrabajadores
            .Select(g => new { label = $"{g.Month:D2}/{g.Year}", value = g.Cantidad }).ToList();

        // Contratos por Mes
        var gruposMesContratos = await contratosBaseQuery
            .Where(c => c.VigenciaDesde != null)
            .GroupBy(c => new { c.VigenciaDesde!.Value.Year, c.VigenciaDesde!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Cantidad = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();
        var contratosPorMes = gruposMesContratos
            .Select(g => new { label = $"{g.Month:D2}/{g.Year}", value = g.Cantidad }).ToList();

        // Contratos Inicios por Mes (VigenciaDesde)
        var contratosIniciosPorMes = await contratosBaseQuery
            .Where(c => !c.Eliminado && c.VigenciaDesde != null)
            .GroupBy(c => new { c.VigenciaDesde!.Value.Year, c.VigenciaDesde!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Cantidad = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();
        var contratosIniciosPorMesList = contratosIniciosPorMes
            .Select(g => new { label = $"{g.Month:D2}/{g.Year}", value = g.Cantidad }).ToList();

        // Contratos Finalizacion por Mes (VigenciaHasta)
        var contratosFinPorMes = await contratosBaseQuery
            .Where(c => !c.Eliminado && c.VigenciaHasta != null)
            .GroupBy(c => new { c.VigenciaHasta!.Value.Year, c.VigenciaHasta!.Value.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Cantidad = g.Count() })
            .OrderBy(g => g.Year).ThenBy(g => g.Month)
            .ToListAsync();
        var contratosFinalizacionPorMesList = contratosFinPorMes
            .Select(g => new { label = $"{g.Month:D2}/{g.Year}", value = g.Cantidad }).ToList();

        // Contratos Eliminados por Mes
        var contratosElimMes = await contratosBaseQuery
            .Where(c => c.Eliminado)
            .ToListAsync();
        var contratosEliminadosPorMesList = contratosElimMes
            .GroupBy(c => {
                var fecha = c.FechaModificacion ?? c.FechaRegistro;
                return fecha != null ? new { fecha.Value.Year, fecha.Value.Month } : null;
            })
            .Where(g => g.Key != null)
            .OrderBy(g => g.Key!.Year).ThenBy(g => g.Key!.Month)
            .Select(g => new { label = $"{g.Key!.Month:D2}/{g.Key!.Year}", value = g.Count() })
            .ToList();

        // Contratos Eliminados por Motivo — MotivoEliminado stores "GRUPO:CODIGO" (e.g. "TIPOELIMINA:1")
        string ResolveMotivoEliminado(string? motivo)
        {
            if (string.IsNullOrEmpty(motivo)) return "Sin motivo";
            var parts = motivo.Split(':');
            if (parts.Length == 2)
            {
                var match = codigos.FirstOrDefault(c => c.Grupo == parts[0] && c.Codigo == parts[1]);
                if (match != null) return match.Nombre ?? motivo;
            }
            return motivo;
        }

        var contratosEliminadosPorMotivoList = contratosElimMes
            .GroupBy(c => string.IsNullOrEmpty(c.MotivoEliminado) ? "Sin motivo" : c.MotivoEliminado)
            .Select(g => new { label = ResolveMotivoEliminado(g.Key), value = g.Count() })
            .OrderByDescending(x => x.value)
            .ToList();

        // Lookup tables for new charts
        var ocupaciones = await _db.OcupacionesLaborales.ToListAsync();
        var entidades = await _db.EntidadesSeguridadSocial.ToListAsync();
        var deptos = await _db.Departamentos.ToListAsync();
        var municipios = await _db.Municipios.ToListAsync();

        // Active contratos for grouping
        var contratosActivos2 = await contratosBaseQuery
            .Where(c => !c.Eliminado)
            .Select(c => new {
                c.CodigoOcupacionLaboral1,
                c.TipoContratoTrabajador,
                c.CodigoEntidadPension,
                c.CodigoEntidadSalud,
                c.CodigoEntidadRiesgos,
                c.CodigoEntidadCaja,
                c.CodigoDepto,
                c.CodigoMpio
            })
            .ToListAsync();

        // Sectores mayor contratacion (Top 9) - first 1 char of CodigoOcupacionLaboral1
        var sectoresContratacionList = contratosActivos2
            .Where(c => !string.IsNullOrEmpty(c.CodigoOcupacionLaboral1) && c.CodigoOcupacionLaboral1.Length >= 1)
            .GroupBy(c => c.CodigoOcupacionLaboral1![..1])
            .Select(g => new {
                label = ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == g.Key)?.NombreOcupacionLaboral ?? $"Sector {g.Key}",
                value = g.Count()
            })
            .OrderByDescending(x => x.value)
            .Take(9)
            .ToList();

        // Tipos de Contratos
        var tiposContratoList = contratosActivos2
            .GroupBy(c => c.TipoContratoTrabajador)
            .Select(g => new {
                label = ResolveCodigo(g.Key, "CODTIPOCONTRATO"),
                value = g.Count()
            })
            .OrderByDescending(x => x.value)
            .ToList();

        // CIUO Nivel 1 - first 1 char
        var ciuoNivel1List = contratosActivos2
            .Where(c => !string.IsNullOrEmpty(c.CodigoOcupacionLaboral1) && c.CodigoOcupacionLaboral1.Length >= 1)
            .GroupBy(c => c.CodigoOcupacionLaboral1![..1])
            .Select(g => new {
                label = ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == g.Key && o.NivelOcupacionLaboral == 1)?.NombreOcupacionLaboral ?? $"CIUO {g.Key}",
                value = g.Count()
            })
            .OrderByDescending(x => x.value)
            .ToList();

        // CIUO Nivel 2 - first 2 chars, top 7
        var ciuoNivel2List = contratosActivos2
            .Where(c => !string.IsNullOrEmpty(c.CodigoOcupacionLaboral1) && c.CodigoOcupacionLaboral1.Length >= 2)
            .GroupBy(c => c.CodigoOcupacionLaboral1![..2])
            .Select(g => new {
                label = ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == g.Key)?.NombreOcupacionLaboral ?? $"CIUO {g.Key}",
                value = g.Count()
            })
            .OrderByDescending(x => x.value)
            .Take(7)
            .ToList();

        // CIUO Nivel 3 - first 3 chars, top 7
        var ciuoNivel3List = contratosActivos2
            .Where(c => !string.IsNullOrEmpty(c.CodigoOcupacionLaboral1) && c.CodigoOcupacionLaboral1.Length >= 3)
            .GroupBy(c => c.CodigoOcupacionLaboral1![..3])
            .Select(g => new {
                label = ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == g.Key)?.NombreOcupacionLaboral ?? $"CIUO {g.Key}",
                value = g.Count()
            })
            .OrderByDescending(x => x.value)
            .Take(7)
            .ToList();

        string ResolveEntidad(string? codigo) {
            if (string.IsNullOrEmpty(codigo)) return "Sin especificar";
            // Try by Id (numeric match) first — stored values are ID_ENTIDAD as string
            if (long.TryParse(codigo, out var id))
            {
                var matchById = entidades.FirstOrDefault(e => e.Id == id);
                if (matchById != null) return matchById.RazonSocial ?? codigo;
            }
            // Fallback: try by CodigoEntidad
            var match = entidades.FirstOrDefault(e => e.CodigoEntidad == codigo);
            return match?.RazonSocial ?? codigo;
        }

        // Pensiones Top 7
        var pensionesTop7List = contratosActivos2
            .GroupBy(c => c.CodigoEntidadPension)
            .Select(g => new { label = ResolveEntidad(g.Key), value = g.Count() })
            .OrderByDescending(x => x.value)
            .Take(7)
            .ToList();

        // Riesgos Top 7
        var riesgosTop7List = contratosActivos2
            .GroupBy(c => c.CodigoEntidadRiesgos)
            .Select(g => new { label = ResolveEntidad(g.Key), value = g.Count() })
            .OrderByDescending(x => x.value)
            .Take(7)
            .ToList();

        // Salud Top 7
        var saludTop7List = contratosActivos2
            .GroupBy(c => c.CodigoEntidadSalud)
            .Select(g => new { label = ResolveEntidad(g.Key), value = g.Count() })
            .OrderByDescending(x => x.value)
            .Take(7)
            .ToList();

        // Caja Top 7
        var cajaTop7List = contratosActivos2
            .GroupBy(c => c.CodigoEntidadCaja)
            .Select(g => new { label = ResolveEntidad(g.Key), value = g.Count() })
            .OrderByDescending(x => x.value)
            .Take(7)
            .ToList();

        // Departamentos Top 7
        var departamentosTop7List = contratosActivos2
            .GroupBy(c => c.CodigoDepto)
            .Select(g => new {
                label = deptos.FirstOrDefault(d => d.Codigo == g.Key)?.Nombre ?? g.Key ?? "Sin especificar",
                value = g.Count()
            })
            .OrderByDescending(x => x.value)
            .Take(7)
            .ToList();

        // Municipios Top 7
        var municipiosTop7List = contratosActivos2
            .GroupBy(c => c.CodigoMpio)
            .Select(g => new {
                label = municipios.FirstOrDefault(m => m.Codigo == g.Key)?.Nombre ?? g.Key ?? "Sin especificar",
                value = g.Count()
            })
            .OrderByDescending(x => x.value)
            .Take(7)
            .ToList();

        return new
        {
            trabajadoresRegistrados,
            trabajadoresActivos,
            totalTrabajadores,
            empresasRegistradas,
            totalOrganizaciones,
            totalContratos,
            contratosCreados,
            totalContratosCreados,
            contratosActivos,
            contratosFinalizados,
            totalContratosFinalizados,
            contratosEliminados,
            porGenero,
            porEstadoCivil,
            porTipoDocumento,
            porNacionalidad,
            porPaisNacimiento,
            porTipoVisa,
            registrosPorMes,
            contratosPorMes,
            contratosIniciosPorMes = contratosIniciosPorMesList,
            contratosFinalizacionPorMes = contratosFinalizacionPorMesList,
            contratosEliminadosPorMes = contratosEliminadosPorMesList,
            contratosEliminadosPorMotivo = contratosEliminadosPorMotivoList,
            sectoresContratacion = sectoresContratacionList,
            tiposContrato = tiposContratoList,
            ciuoNivel1 = ciuoNivel1List,
            ciuoNivel2 = ciuoNivel2List,
            ciuoNivel3 = ciuoNivel3List,
            pensionesTop7 = pensionesTop7List,
            riesgosTop7 = riesgosTop7List,
            saludTop7 = saludTop7List,
            cajaTop7 = cajaTop7List,
            departamentosTop7 = departamentosTop7List,
            municipiosTop7 = municipiosTop7List
        };
    }

    public async Task<object> GetDashboardRueAsync(DateTime? fechaDesde = null, DateTime? fechaHasta = null)
    {
        var desde = fechaDesde ?? new DateTime(2020, 1, 1);
        var hasta = fechaHasta ?? DateTime.Now;
        var desdeStr = desde.ToString("yyyy-MM-dd");
        var hastaStr = hasta.ToString("yyyy-MM-dd");

        // Helper to run a count query against RUE database
        async Task<int> CountRueSql(string sql)
        {
            using var cmd = _rueDb.Database.GetDbConnection().CreateCommand();
            cmd.CommandText = sql;
            if (cmd.Connection!.State != System.Data.ConnectionState.Open)
                await cmd.Connection.OpenAsync();
            var result = await cmd.ExecuteScalarAsync();
            return result != null && result != DBNull.Value ? Convert.ToInt32(result) : 0;
        }

        // Helper to run a label+value query
        async Task<List<object>> LabelValueRueSql(string sql)
        {
            var items = new List<object>();
            using var cmd = _rueDb.Database.GetDbConnection().CreateCommand();
            cmd.CommandText = sql;
            if (cmd.Connection!.State != System.Data.ConnectionState.Open)
                await cmd.Connection.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var label = reader.IsDBNull(0) ? "Sin especificar" : reader.GetString(0).Trim();
                var value = reader.GetInt32(1);
                if (!string.IsNullOrWhiteSpace(label))
                    items.Add(new { label, value });
            }
            return items;
        }

        // KPI 1: Empresas Registradas (approved RUTEC solicitudes in date range)
        var empresasRegistradas = await CountRueSql(
            $"SELECT COUNT(*) FROM SOLICITUD_REGISTRO WHERE CANAL='RUTEC' AND CODIGO_ESTADO='CODESTADOAPROBACION:A' AND FECHA_REGISTRO >= '{desdeStr}' AND FECHA_REGISTRO <= '{hastaStr}'");

        // KPI 2: Todas (acumulado, no start date filter)
        var totalEmpresas = await CountRueSql(
            $"SELECT COUNT(*) FROM SOLICITUD_REGISTRO WHERE CANAL='RUTEC' AND CODIGO_ESTADO='CODESTADOAPROBACION:A' AND FECHA_REGISTRO <= '{hastaStr}'");

        // KPI 3: Solicitudes Realizadas (all RUTEC solicitudes in date range)
        var solicitudesRealizadas = await CountRueSql(
            $"SELECT COUNT(*) FROM SOLICITUD_REGISTRO WHERE CANAL='RUTEC' AND FECHA_REGISTRO >= '{desdeStr}' AND FECHA_REGISTRO <= '{hastaStr}'");

        // KPI 4: Total Realizadas (all RUTEC solicitudes up to end date)
        var totalSolicitudes = await CountRueSql(
            $"SELECT COUNT(*) FROM SOLICITUD_REGISTRO WHERE CANAL='RUTEC' AND FECHA_REGISTRO <= '{hastaStr}'");

        // Chart 5: Registros de empresas por mes (approved, grouped by month)
        var registrosPorMes = await LabelValueRueSql(
            $@"SELECT FORMAT(FECHA_REGISTRO, 'MM/yyyy') AS Mes, COUNT(*) AS Cantidad
               FROM SOLICITUD_REGISTRO
               WHERE CANAL='RUTEC' AND CODIGO_ESTADO='CODESTADOAPROBACION:A'
                 AND FECHA_REGISTRO >= '{desdeStr}' AND FECHA_REGISTRO <= '{hastaStr}'
               GROUP BY FORMAT(FECHA_REGISTRO, 'MM/yyyy'), YEAR(FECHA_REGISTRO), MONTH(FECHA_REGISTRO)
               ORDER BY YEAR(FECHA_REGISTRO), MONTH(FECHA_REGISTRO)");

        // Chart 6: Departamentos Top 7 (from SOLICITUD_REGISTRO joined with PARAM_DEPARTAMENTO)
        var departamentosTop7 = await LabelValueRueSql(
            $@"SELECT TOP 7 ISNULL(d.NOMDEPARTAMENTOCONSULTA, s.CODIGO_DEPTO) AS Label, COUNT(*) AS Cantidad
               FROM SOLICITUD_REGISTRO s
               LEFT JOIN PARAM_DEPARTAMENTO d ON s.CODIGO_DEPTO = d.CODDEPARTAMENTO
               WHERE s.CANAL='RUTEC' AND s.CODIGO_ESTADO='CODESTADOAPROBACION:A'
                 AND s.FECHA_REGISTRO >= '{desdeStr}' AND s.FECHA_REGISTRO <= '{hastaStr}'
                 AND s.CODIGO_DEPTO IS NOT NULL AND s.CODIGO_DEPTO <> ''
               GROUP BY ISNULL(d.NOMDEPARTAMENTOCONSULTA, s.CODIGO_DEPTO)
               ORDER BY COUNT(*) DESC");

        // Chart 7: Municipios Top 7 (from SOLICITUD_REGISTRO joined with PARAM_MUNICIPIO)
        var municipiosTop7 = await LabelValueRueSql(
            $@"SELECT TOP 7 ISNULL(m.NOMMUNICIPIONACIONAL, s.CODIGO_MPIO) AS Label, COUNT(*) AS Cantidad
               FROM SOLICITUD_REGISTRO s
               LEFT JOIN PARAM_MUNICIPIO m ON s.CODIGO_MPIO = m.CODMUNICIPIO
               WHERE s.CANAL='RUTEC' AND s.CODIGO_ESTADO='CODESTADOAPROBACION:A'
                 AND s.FECHA_REGISTRO >= '{desdeStr}' AND s.FECHA_REGISTRO <= '{hastaStr}'
                 AND s.CODIGO_MPIO IS NOT NULL AND s.CODIGO_MPIO <> ''
               GROUP BY ISNULL(m.NOMMUNICIPIONACIONAL, s.CODIGO_MPIO)
               ORDER BY COUNT(*) DESC");

        // Charts 8-10: CIUO from vw_actividad_empresa
        // Expr5 = gran grupo (Nivel 1), Expr2 = sub-grupo (Nivel 2), nombre_actividad_economica = detail (Nivel 3)
        // Only for organizations that have approved RUTEC solicitudes
        var ciuoNivel1 = await LabelValueRueSql(
            $@"SELECT TOP 7 v.Expr5 AS Label, COUNT(*) AS Cantidad
               FROM vw_actividad_empresa v
               INNER JOIN ORGANIZACION o ON v.ID_ORGANIZACION = o.ID_ORGANIZACION
               INNER JOIN SOLICITUD_REGISTRO s ON o.ID_SOLICITUD = s.ID_SOLICITUD
               WHERE s.CANAL='RUTEC' AND s.CODIGO_ESTADO='CODESTADOAPROBACION:A'
                 AND s.FECHA_REGISTRO >= '{desdeStr}' AND s.FECHA_REGISTRO <= '{hastaStr}'
                 AND v.Expr5 IS NOT NULL AND v.Expr5 <> ''
               GROUP BY v.Expr5
               ORDER BY COUNT(*) DESC");

        var ciuoNivel2 = await LabelValueRueSql(
            $@"SELECT TOP 7 v.Expr2 AS Label, COUNT(*) AS Cantidad
               FROM vw_actividad_empresa v
               INNER JOIN ORGANIZACION o ON v.ID_ORGANIZACION = o.ID_ORGANIZACION
               INNER JOIN SOLICITUD_REGISTRO s ON o.ID_SOLICITUD = s.ID_SOLICITUD
               WHERE s.CANAL='RUTEC' AND s.CODIGO_ESTADO='CODESTADOAPROBACION:A'
                 AND s.FECHA_REGISTRO >= '{desdeStr}' AND s.FECHA_REGISTRO <= '{hastaStr}'
                 AND v.Expr2 IS NOT NULL AND v.Expr2 <> ''
               GROUP BY v.Expr2
               ORDER BY COUNT(*) DESC");

        var ciuoNivel3 = await LabelValueRueSql(
            $@"SELECT TOP 7 v.nombre_actividad_economica AS Label, COUNT(*) AS Cantidad
               FROM vw_actividad_empresa v
               INNER JOIN ORGANIZACION o ON v.ID_ORGANIZACION = o.ID_ORGANIZACION
               INNER JOIN SOLICITUD_REGISTRO s ON o.ID_SOLICITUD = s.ID_SOLICITUD
               WHERE s.CANAL='RUTEC' AND s.CODIGO_ESTADO='CODESTADOAPROBACION:A'
                 AND s.FECHA_REGISTRO >= '{desdeStr}' AND s.FECHA_REGISTRO <= '{hastaStr}'
                 AND v.nombre_actividad_economica IS NOT NULL AND v.nombre_actividad_economica <> ''
               GROUP BY v.nombre_actividad_economica
               ORDER BY COUNT(*) DESC");

        return new
        {
            empresasRegistradas,
            totalEmpresas,
            solicitudesRealizadas,
            totalSolicitudes,
            registrosPorMes,
            departamentosTop7,
            municipiosTop7,
            ciuoNivel1,
            ciuoNivel2,
            ciuoNivel3
        };
    }

    public async Task<byte[]> ExportarExcelAsync(string tipo)
    {
        using var workbook = new XLWorkbook();

        switch (tipo.ToLowerInvariant())
        {
            case "general":
            {
                var data = await GetGeneralAsync();
                var ws = workbook.Worksheets.Add("General");
                ws.Cell(1, 1).Value = "Indicador";
                ws.Cell(1, 2).Value = "Cantidad";
                ws.Cell(2, 1).Value = "Total Organizaciones";
                ws.Cell(2, 2).Value = data.TotalOrganizaciones;
                ws.Cell(3, 1).Value = "Total Trabajadores";
                ws.Cell(3, 2).Value = data.TotalTrabajadores;
                ws.Cell(4, 1).Value = "Total Contratos";
                ws.Cell(4, 2).Value = data.TotalContratos;
                FormatHeaders(ws);
                break;
            }
            case "genero":
                await WriteItemSheet(workbook, "Por Genero", await GetPorGeneroAsync());
                break;
            case "nacionalidad":
                await WriteItemSheet(workbook, "Por Nacionalidad", await GetPorNacionalidadAsync());
                break;
            case "nivel-academico":
                await WriteItemSheet(workbook, "Por Nivel Academico", await GetPorNivelAcademicoAsync());
                break;
            case "sector-economico":
                await WriteItemSheet(workbook, "Por Sector Economico", await GetPorSectorEconomicoAsync());
                break;
            case "zona":
                await WriteItemSheet(workbook, "Por Zona", await GetPorZonaAsync());
                break;
            case "ano-nacimiento":
                await WriteItemSheet(workbook, "Por Ano Nacimiento", await GetPorAnoNacimientoAsync());
                break;
            case "empresas-registradas":
            {
                var data = await GetEmpresasRegistradasAsync();
                var ws = workbook.Worksheets.Add("Empresas Registradas");
                ws.Cell(1, 1).Value = "ID Organizacion";
                ws.Cell(1, 2).Value = "Cantidad Trabajadores";
                ws.Cell(1, 3).Value = "Fecha Primer Registro";
                for (int i = 0; i < data.Count; i++)
                {
                    ws.Cell(i + 2, 1).Value = data[i].IdOrganizacion;
                    ws.Cell(i + 2, 2).Value = data[i].CantidadTrabajadores;
                    ws.Cell(i + 2, 3).Value = data[i].FechaPrimerRegistro?.ToString("yyyy-MM-dd") ?? "";
                }
                FormatHeaders(ws);
                break;
            }
            case "cantidad-trabajadores":
                await WriteItemSheet(workbook, "Cantidad Trabajadores", await GetCantidadTrabajadoresAsync());
                break;
            case "rue-general":
                await WriteItemSheet(workbook, "RUE General", await GetRueGeneralAsync());
                break;
            case "rue-dia":
                await WriteItemSheet(workbook, "RUE Dia", await GetRueDiaAsync());
                break;
            case "gestion-general":
                await WriteItemSheet(workbook, "Gestion General", await GetGestionGeneralAsync());
                break;
            case "gestion-dia":
                await WriteItemSheet(workbook, "Gestion Dia", await GetGestionDiaAsync());
                break;
            default:
                throw new ArgumentException($"Tipo de reporte no valido: {tipo}");
        }

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    private static Task WriteItemSheet(XLWorkbook workbook, string sheetName, List<ReporteItemDto> items)
    {
        var ws = workbook.Worksheets.Add(sheetName);
        ws.Cell(1, 1).Value = "Categoria";
        ws.Cell(1, 2).Value = "Cantidad";
        for (int i = 0; i < items.Count; i++)
        {
            ws.Cell(i + 2, 1).Value = items[i].Categoria ?? "";
            ws.Cell(i + 2, 2).Value = items[i].Cantidad;
        }
        FormatHeaders(ws);
        return Task.CompletedTask;
    }

    private static void FormatHeaders(IXLWorksheet ws)
    {
        var headerRow = ws.Row(1);
        headerRow.Style.Font.Bold = true;
        ws.Columns().AdjustToContents();
    }
}
