using Microsoft.EntityFrameworkCore;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;
using RUTEC.Domain.Constants;
using RUTEC.Domain.Entities;
using RUTEC.Infrastructure.Data;

namespace RUTEC.Infrastructure.Services;

public class CalidadServiceImpl : ICalidadService
{
    private readonly RutecDbContext _db;
    private readonly RueReadOnlyDbContext _rueDb;

    public CalidadServiceImpl(RutecDbContext db, RueReadOnlyDbContext rueDb)
    {
        _db = db;
        _rueDb = rueDb;
    }

    private async Task<Dictionary<long, string>> GetOrgNamesAsync(IEnumerable<long> orgIds)
    {
        var ids = orgIds.Distinct().ToList();
        if (ids.Count == 0) return new();
        var orgs = await _rueDb.Organizaciones
            .Where(o => ids.Contains(o.IdOrganizacion))
            .Select(o => new { o.IdOrganizacion, o.NombreCompleto })
            .ToListAsync();
        return orgs.ToDictionary(o => o.IdOrganizacion, o => o.NombreCompleto ?? "");
    }

    public async Task<List<EmpresaVerificacionDto>> GetEmpresasAsync()
    {
        // Group contratos by organization with verification counts
        var empresas = await _db.Contratos
            .Where(c => !c.Eliminado && c.IdOrganizacion.HasValue)
            .GroupBy(c => c.IdOrganizacion!.Value)
            .Select(g => new
            {
                IdOrganizacion = g.Key,
                TotalContratos = g.Count(),
                ContratosAprobados = g.Count(c =>
                    c.Verificaciones.OrderByDescending(v => v.FechaRegistro).FirstOrDefault()!.Aclaracion == "A"),
                ContratosPendientes = g.Count(c =>
                    !c.Verificaciones.Any() ||
                    c.Verificaciones.OrderByDescending(v => v.FechaRegistro).FirstOrDefault()!.Aclaracion == "PN")
            })
            .ToListAsync();

        // Get organization names from trabajadores (IdOrganizacion maps to org)
        var orgIds = empresas.Select(e => e.IdOrganizacion).ToList();
        var orgNames = await _db.Contratos
            .Where(c => c.IdOrganizacion.HasValue && orgIds.Contains(c.IdOrganizacion.Value))
            .Select(c => new { c.IdOrganizacion, c.DenominacionContrato })
            .GroupBy(c => c.IdOrganizacion)
            .Select(g => new { IdOrganizacion = g.Key, Nombre = g.First().DenominacionContrato })
            .ToDictionaryAsync(x => x.IdOrganizacion!.Value, x => x.Nombre);

        return empresas.Select(e => new EmpresaVerificacionDto(
            e.IdOrganizacion,
            orgNames.GetValueOrDefault(e.IdOrganizacion),
            e.TotalContratos,
            e.ContratosPendientes,
            e.ContratosAprobados
        )).ToList();
    }

    public async Task<List<EmpresaVerificacionDto>> GetEmpresasPendientesAsync()
    {
        var todas = await GetEmpresasAsync();
        return todas.Where(e => e.ContratosPendientes > 0).ToList();
    }

    public async Task<List<EmpresaVerificacionDto>> GetEmpresasAprobadasAsync()
    {
        var todas = await GetEmpresasAsync();
        return todas.Where(e => e.ContratosPendientes == 0 && e.ContratosAprobados == e.TotalContratos).ToList();
    }

    public async Task<List<ContratoVerificacionDto>> GetContratosEmpresaAsync(long idOrganizacion)
    {
        var ahora = DateTime.Now;

        var contratos = await _db.Contratos
            .Where(c => c.IdOrganizacion == idOrganizacion && !c.Eliminado)
            .Include(c => c.MigranteTrabajador)
            .Include(c => c.Verificaciones)
            .OrderByDescending(c => c.FechaRegistro)
            .ToListAsync();

        return contratos.Select(c =>
        {
            var ultimaVerif = c.Verificaciones
                .OrderByDescending(v => v.FechaRegistro)
                .FirstOrDefault();

            var t = c.MigranteTrabajador;
            var nombreCompleto = t != null
                ? $"{t.PrimerNombre} {t.SegundoNombre} {t.PrimerApellido} {t.SegundoApellido}".Trim()
                : null;

            // Alert: >30 days since contract registration without any verification
            var alertaDias = !c.Verificaciones.Any() &&
                             c.FechaRegistro.HasValue &&
                             (ahora - c.FechaRegistro.Value).TotalDays > 30;

            // Alert: contract modified after last verification
            var alertaModificado = ultimaVerif != null &&
                                   c.FechaModificacion.HasValue &&
                                   ultimaVerif.FechaRegistro.HasValue &&
                                   c.FechaModificacion.Value > ultimaVerif.FechaRegistro.Value;

            return new ContratoVerificacionDto(
                c.Id,
                c.IdMigranteTrabajador ?? 0,
                nombreCompleto,
                t?.NumeroCedulaExtranjeria,
                c.CargoTrabajador,
                c.VigenciaDesde,
                c.VigenciaHasta,
                ultimaVerif?.Aclaracion,
                ultimaVerif?.MotivoAclaracion,
                ultimaVerif?.Observacion,
                ultimaVerif?.UsuarioRegistro,
                ultimaVerif?.FechaRegistro,
                alertaDias,
                alertaModificado
            );
        }).ToList();
    }

    public async Task<bool> AsignarVerificadorAsync(long contratoId, AsignarVerificadorDto dto)
    {
        var contrato = await _db.Contratos.FindAsync(contratoId);
        if (contrato == null || contrato.Eliminado) return false;

        var verificacion = new VerificacionContrato
        {
            IdMigranteContratoTrabajador = contratoId,
            Aclaracion = "PN",
            Observacion = "Verificador asignado",
            UsuarioRegistro = dto.UsuarioVerificador,
            FechaRegistro = DateTime.Now
        };

        _db.VerificacionesContratos.Add(verificacion);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RegistrarVerificacionAsync(long contratoId, RegistrarAclaracionDto dto, string usuario)
    {
        // Legacy pattern: UPDATE existing verification row (not INSERT new)
        // Use raw SQL with SqlParameter to handle nullable fields
        var parameters = new[]
        {
            new Microsoft.Data.SqlClient.SqlParameter("@aclaracion", (object?)dto.Aclaracion ?? DBNull.Value),
            new Microsoft.Data.SqlClient.SqlParameter("@motivo", (object?)dto.MotivoAclaracion ?? DBNull.Value),
            new Microsoft.Data.SqlClient.SqlParameter("@observacion", (object?)dto.Observacion ?? DBNull.Value),
            new Microsoft.Data.SqlClient.SqlParameter("@usuario", (object?)usuario ?? DBNull.Value),
            new Microsoft.Data.SqlClient.SqlParameter("@fecha", DateTime.Now),
            new Microsoft.Data.SqlClient.SqlParameter("@contratoId", contratoId)
        };
        var rows = await _db.Database.ExecuteSqlRawAsync(
            "UPDATE TB_VERIFICACION_CONTRATO SET ACLARACION = @aclaracion, MOTIVO_ACLARACION = @motivo, OBSERVACION = @observacion, USUARIO_REGISTRO = @usuario, FECHA_REGISTRO = @fecha WHERE ID_MIGRANTE_TRABAJADOR_CONTRATO = @contratoId",
            parameters);
        return rows > 0;
    }

    public async Task<List<VerificadorGestionDto>> GetVerificadoresAsync()
    {
        var all = await _db.VerificacionesContratos
            .Where(v => v.UsuarioRegistro != null && v.UsuarioRegistro != "")
            .Select(v => new { v.UsuarioRegistro, v.Aclaracion })
            .ToListAsync();

        return all
            .GroupBy(v => (v.UsuarioRegistro ?? "").Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new VerificadorGestionDto(
                g.Key,
                g.Count(),
                g.Count(v => v.Aclaracion != null),
                g.Count(v => v.Aclaracion == null)
            ))
            .OrderBy(v => v.UsuarioRegistro, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public async Task<List<ContratoGestionDto>> GetContratosGestionAsync(string estado, string? verificador = null)
    {
        // Load all verifications grouped by contrato (latest per contrato)
        var allVerifs = await _db.VerificacionesContratos.ToListAsync();
        var latestVerifByContrato = allVerifs
            .GroupBy(v => v.IdMigranteContratoTrabajador)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(v => v.FechaRegistro).First());

        // Load contratos (non-eliminated) that have verifications
        var contratoIds = latestVerifByContrato.Keys.ToList();
        var contratos = await _db.Contratos
            .Where(c => !c.Eliminado && contratoIds.Contains(c.Id))
            .ToListAsync();

        // Filter by estado
        var filtered = contratos.Where(c =>
        {
            var verif = latestVerifByContrato.GetValueOrDefault(c.Id);
            return estado switch
            {
                "por-aclarar" => verif == null || verif.Aclaracion == null,
                "aclarada" => verif != null && verif.Aclaracion != null && verif.Aclaracion != "PN",
                "pendiente" => verif != null && verif.Aclaracion == "PN",
                _ => true
            };
        });

        // Filter by verificador
        if (!string.IsNullOrEmpty(verificador))
            filtered = filtered.Where(c =>
            {
                var verif = latestVerifByContrato.GetValueOrDefault(c.Id);
                return verif != null && string.Equals(verif.UsuarioRegistro, verificador, StringComparison.OrdinalIgnoreCase);
            });

        var filteredList = filtered.ToList();

        // Load related data
        var trabajadorIds = filteredList.Select(c => c.IdMigranteTrabajador).Distinct().ToList();
        var trabajadores = await _db.MigrantesTrabajadores
            .Where(t => trabajadorIds.Contains(t.Id))
            .ToListAsync();

        var idiomasCounts = await _db.ContratosIdiomas
            .Where(i => trabajadorIds.Contains(i.IdTrabajadorMigrante))
            .GroupBy(i => i.IdTrabajadorMigrante)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToListAsync();
        var idiomasDict = idiomasCounts.ToDictionary(x => x.Id, x => x.Count);

        var nivelesCounts = await _db.ContratosNivelesEducativos
            .Where(n => trabajadorIds.Contains(n.IdTrabajadorMigrante))
            .GroupBy(n => n.IdTrabajadorMigrante)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToListAsync();
        var nivelesDict = nivelesCounts.ToDictionary(x => x.Id, x => x.Count);

        // Get org names from RUE
        var orgIds = filteredList.Where(c => c.IdOrganizacion.HasValue).Select(c => c.IdOrganizacion!.Value).Distinct().ToList();
        var orgNames = await GetOrgNamesAsync(orgIds);

        // Get motivos codes for resolving MOTIVO_ACLARACION
        var motivosRefs = new CodigoReferenciaResolver(await _db.CodigosReferencia.ToListAsync());

        string? ResolveMotivos(string? motivoAclaracion)
        {
            if (string.IsNullOrEmpty(motivoAclaracion)) return null;
            var nombres = motivoAclaracion.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => motivosRefs.Describir(s.Trim(), GruposCodigoReferencia.Aclaracion));
            return string.Join(", ", nombres);
        }

        return filteredList.Select(c =>
        {
            var t = trabajadores.FirstOrDefault(t => t.Id == c.IdMigranteTrabajador);
            var verif = latestVerifByContrato.GetValueOrDefault(c.Id);
            var nombre = t != null
                ? $"{t.PrimerNombre} {t.SegundoNombre} {t.PrimerApellido} {t.SegundoApellido}".Trim()
                : null;
            var orgName = c.IdOrganizacion.HasValue && orgNames.TryGetValue(c.IdOrganizacion.Value, out var n) ? n : "";

            // Alerta dias: > 30 dias desde verificacion sin cambios
            var diasSinGestion = verif?.FechaRegistro.HasValue == true && (DateTime.Now - verif.FechaRegistro!.Value).TotalDays > 30;
            // Alerta modificado: el contrato fue modificado despues de la verificacion
            var contratoModificado = c.FechaModificacion.HasValue && verif?.FechaRegistro.HasValue == true
                && c.FechaModificacion.Value > verif.FechaRegistro.Value;
            var alertaDias = diasSinGestion && !contratoModificado;
            var alertaModificado = contratoModificado;

            return new ContratoGestionDto(
                c.Id,
                orgName,
                t?.NumeroCedulaExtranjeria,
                nombre,
                c.IdMigranteTrabajador.HasValue ? idiomasDict.GetValueOrDefault(c.IdMigranteTrabajador.Value, 0) : 0,
                c.IdMigranteTrabajador.HasValue ? nivelesDict.GetValueOrDefault(c.IdMigranteTrabajador.Value, 0) : 0,
                verif?.Aclaracion,
                verif?.Observacion,
                verif?.FechaRegistro,
                ResolveMotivos(verif?.MotivoAclaracion),
                alertaDias,
                alertaModificado
            );
        }).OrderBy(x => x.ContratoId).ToList();
    }

    public async Task<List<object>> GetContratosVerificadorAsync(string usuario)
    {
        var verifs = await _db.VerificacionesContratos
            .Where(v => v.UsuarioRegistro == usuario)
            .ToListAsync();

        var contratoIds = verifs.Select(v => v.IdMigranteContratoTrabajador).Distinct().ToList();
        var contratos = await _db.Contratos
            .Where(c => contratoIds.Contains(c.Id))
            .ToListAsync();
        var trabajadorIds = contratos.Select(c => c.IdMigranteTrabajador).Distinct().ToList();
        var trabajadores = await _db.MigrantesTrabajadores
            .Where(t => trabajadorIds.Contains(t.Id))
            .ToListAsync();

        var refs = new CodigoReferenciaResolver(await _db.CodigosReferencia.ToListAsync());

        var orgIds = contratos.Where(c => c.IdOrganizacion.HasValue).Select(c => c.IdOrganizacion!.Value).Distinct().ToList();
        var orgNames = await GetOrgNamesAsync(orgIds);

        return verifs.Select(v =>
        {
            var contrato = contratos.FirstOrDefault(c => c.Id == v.IdMigranteContratoTrabajador);
            var trabajador = contrato != null ? trabajadores.FirstOrDefault(t => t.Id == contrato.IdMigranteTrabajador) : null;
            var motivos = string.IsNullOrEmpty(v.MotivoAclaracion) ? "" :
                string.Join(", ", v.MotivoAclaracion.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(m => refs.Describir(m.Trim(), GruposCodigoReferencia.Aclaracion)));

            // VERIFICADO: aclaracion is null = pending, can be removed
            var verificado = v.Aclaracion == null;
            // ALERTADIAS: >30 days since verification and no modifications after
            var diasSinGestion = v.FechaRegistro.HasValue && (DateTime.Now - v.FechaRegistro.Value).TotalDays > 30;
            var contratoModificado = contrato?.FechaModificacion != null && v.FechaRegistro != null
                && contrato.FechaModificacion > v.FechaRegistro;
            var alertaDias = diasSinGestion && !contratoModificado;
            // ALERTAMODIFICADO: record was modified after verification date
            var alertaModificado = contratoModificado;

            return (object)new
            {
                verificacionId = v.Id,
                contratoId = v.IdMigranteContratoTrabajador,
                nombreOrganizacion = contrato?.IdOrganizacion != null && orgNames.TryGetValue(contrato.IdOrganizacion.Value, out var name) ? name : "",
                docTrabajador = trabajador?.NumeroCedulaExtranjeria,
                nombreTrabajador = trabajador != null
                    ? $"{trabajador.PrimerNombre} {trabajador.SegundoNombre} {trabajador.PrimerApellido} {trabajador.SegundoApellido}".Trim()
                    : null,
                fechaGestion = v.FechaRegistro?.ToString("yyyy-MM-dd"),
                motivos,
                verificado,
                alertaDias,
                alertaModificado
            };
        }).OrderBy(x => ((dynamic)x).contratoId).ToList();
    }

    public async Task<bool> EliminarVerificacionAsync(long id)
    {
        var v = await _db.VerificacionesContratos.FindAsync(id);
        if (v == null) return false;
        _db.VerificacionesContratos.Remove(v);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<object?> GetContratoDetalleVerificacionAsync(long contratoId)
    {
        var contrato = await _db.Contratos
            .Include(c => c.MigranteTrabajador)
            .FirstOrDefaultAsync(c => c.Id == contratoId);
        if (contrato == null) return null;

        var trabajador = contrato.MigranteTrabajador;

        // === Organization data from RUE ===
        object? organizacion = null;
        if (contrato.IdOrganizacion.HasValue)
        {
            var org = await _rueDb.Organizaciones
                .FirstOrDefaultAsync(o => o.IdOrganizacion == contrato.IdOrganizacion.Value);

            string? tipoDocOrg = null;
            if (org?.CodigoDocId != null)
            {
                // RUE CODIGO_DOC_ID = ID_CODREF (e.g. "CODDOCID:NIT") → lookup DESCRIPCION
                var rueRef = await _rueDb.CodigosReferencia.FindAsync(org.CodigoDocId);
                tipoDocOrg = rueRef?.Descripcion ?? org.CodigoDocId;
            }

            string? actividadEconomica = null;
            if (org?.CodigoActividad != null)
            {
                actividadEconomica = (await _rueDb.ActividadesEconomicas
                    .FirstOrDefaultAsync(a => a.CodigoActividad == org.CodigoActividad))?.NombreActividad
                    ?? org.CodigoActividad;
            }

            // Resolve regimen tributario: legacy uses CODIGO_TIPO_PERSONA → lookup by ID_CODREF → DESCRIPCION
            string? regimenTributario = org?.CodigoTipoPersona;
            if (!string.IsNullOrEmpty(regimenTributario))
            {
                var rueRef = await _rueDb.CodigosReferencia.FindAsync(regimenTributario);
                regimenTributario = rueRef?.Descripcion ?? regimenTributario;
            }

            organizacion = new
            {
                tipoDocumento = tipoDocOrg,
                numeroDocumento = org?.ValorDocId,
                digitoChequeo = org?.DigitoChequeo,
                nombreCompleto = org?.NombreCompleto,
                regimenTributario,
                actividadEconomica,
                habilitada = org?.Habilitada,
                fechaRegistro = org?.FechaRegistro
            };
        }

        // === Worker data ===
        object? trabajadorData = null;
        if (trabajador != null)
        {
            var refs = new CodigoReferenciaResolver(await _db.CodigosReferencia.ToListAsync());
            var paises = await _db.Paises.ToListAsync();

            var tipoDoc = refs.Describir(trabajador.TipoDocumento, GruposCodigoReferencia.TipoDocumento);
            var genero = refs.Describir(trabajador.CodigoGenero, GruposCodigoReferencia.Genero);
            var estadoCivil = refs.Describir(trabajador.CodigoEstadoCivil, GruposCodigoReferencia.EstadoCivil);
            var paisNacimiento = paises.FirstOrDefault(p => p.Codigo == trabajador.CodigoPaisNacimiento)?.Nombre
                ?? trabajador.CodigoPaisNacimiento;
            var paisCiudadania = paises.FirstOrDefault(p => p.Codigo == trabajador.CodigoPaisCiudadania)?.Nombre
                ?? trabajador.CodigoPaisCiudadania;

            trabajadorData = new
            {
                tipoDocumento = tipoDoc,
                numeroCedula = trabajador.NumeroCedulaExtranjeria,
                nombreCompleto = $"{trabajador.PrimerNombre} {trabajador.SegundoNombre} {trabajador.PrimerApellido} {trabajador.SegundoApellido}".Trim(),
                fechaNacimiento = trabajador.FechaNacimiento,
                paisNacimiento,
                paisCiudadania,
                genero,
                estadoCivil,
                pasaporte = trabajador.NumeroPasaporte,
                fechaRegistro = trabajador.FechaRegistro,
                contratoHabilitado = trabajador.ContratoHabilitado
            };
        }

        // === Idiomas ===
        var idiomasRaw = trabajador != null
            ? await _db.ContratosIdiomas.Where(i => i.IdTrabajadorMigrante == trabajador.Id).ToListAsync()
            : new List<ContratoIdioma>();

        var codigosRef = new CodigoReferenciaResolver(await _db.CodigosReferencia.ToListAsync());

        var idiomas = idiomasRaw.Select(i => new
        {
            idioma = codigosRef.Describir(i.CodigoIdioma, GruposCodigoReferencia.TipoIdioma),
            nivelHablado = codigosRef.Describir(i.CodigoNivelHablado, GruposCodigoReferencia.CalificacionIdioma),
            nivelLeido = codigosRef.Describir(i.CodigoNivelLeido, GruposCodigoReferencia.CalificacionIdioma),
            nivelEscrito = codigosRef.Describir(i.CodigoNivelEscrito, GruposCodigoReferencia.CalificacionIdioma)
        }).ToList();

        // === Niveles educativos ===
        var nivelesRaw = trabajador != null
            ? await _db.ContratosNivelesEducativos.Where(n => n.IdTrabajadorMigrante == trabajador.Id).ToListAsync()
            : new List<ContratoNivelEducativo>();

        var niveles = nivelesRaw.Select(n => new
        {
            nivelEducativo = codigosRef.Describir(n.CodigoNivelEducativo, GruposCodigoReferencia.NivelEducativo),
            semestresCursados = n.SemestresCursados,
            obtuvoTitulo = n.ObtuvoTituloEducativo,
            titulo = n.TituloNivelEducativo
        }).ToList();

        // === Contract data ===
        var ocupaciones = await _db.OcupacionesLaborales.ToListAsync();
        var entidades = await _db.EntidadesSeguridadSocial.ToListAsync();
        var departamentos = await _db.Departamentos.ToListAsync();
        var municipios = await _db.Municipios.ToListAsync();

        // tipoContrato might be an Id (numeric) or a Codigo
        var tipoContrato = codigosRef.Describir(contrato.TipoContratoTrabajador, GruposCodigoReferencia.TipoContrato);
        var ocupacion1 = ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == contrato.CodigoOcupacionLaboral1)?.NombreOcupacionLaboral;
        var ocupacion2 = ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == contrato.CodigoOcupacionLaboral2)?.NombreOcupacionLaboral;
        var ocupacion3 = ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == contrato.CodigoOcupacionLaboral3)?.NombreOcupacionLaboral;
        // Entidades: contract stores ID_ENTIDAD (numeric) in varchar columns, so match by Id first, fallback to CodigoEntidad
        string? ResolveEntidad(string? value)
        {
            if (string.IsNullOrEmpty(value)) return null;
            if (long.TryParse(value, out var entId))
                return entidades.FirstOrDefault(e => e.Id == entId)?.RazonSocial;
            return entidades.FirstOrDefault(e => e.CodigoEntidad == value)?.RazonSocial;
        }
        var entidadPension = ResolveEntidad(contrato.CodigoEntidadPension);
        var entidadSalud = ResolveEntidad(contrato.CodigoEntidadSalud);
        var entidadRiesgos = ResolveEntidad(contrato.CodigoEntidadRiesgos);
        var entidadCaja = ResolveEntidad(contrato.CodigoEntidadCaja);
        var depto = departamentos.FirstOrDefault(d => d.Codigo == contrato.CodigoDepto)?.Nombre;
        var mpio = municipios.FirstOrDefault(m => m.Codigo == contrato.CodigoMpio)?.Nombre;

        var contratoData = new
        {
            denominacion = contrato.DenominacionContrato,
            tipoContrato,
            vigenciaDesde = contrato.VigenciaDesde,
            vigenciaHasta = contrato.VigenciaHasta,
            ocupacionLaboral1 = ocupacion1,
            ocupacionLaboral2 = ocupacion2,
            ocupacionLaboral3 = ocupacion3,
            cargo = contrato.CargoTrabajador,
            descripcion = contrato.DescripcionContrato,
            entidadPension,
            entidadSalud,
            entidadRiesgos,
            entidadCaja,
            profesion = contrato.Profesion,
            tarjetaProfesional = contrato.TarjetaProfesional,
            departamento = depto,
            municipio = mpio,
            fechaRegistro = contrato.FechaRegistro,
            fechaModificacion = contrato.FechaModificacion,
            usuarioModificacion = contrato.UsuarioModificacion,
            eliminado = contrato.Eliminado,
            motivoEliminado = contrato.MotivoEliminado
        };

        return new
        {
            contratoId,
            organizacion,
            trabajador = trabajadorData,
            idiomas,
            nivelesEducativos = niveles,
            contrato = contratoData
        };
    }

    public async Task<int> GetContratosDisponiblesCountAsync()
    {
        // Legacy query does not filter by Eliminado
        var cutoff = new DateTime(2020, 1, 1);
        return await _db.Contratos
            .Where(c => c.VigenciaHasta.HasValue && c.VigenciaHasta.Value >= cutoff)
            .Where(c => !_db.VerificacionesContratos.Any(v => v.IdMigranteContratoTrabajador == c.Id))
            .CountAsync();
    }

    public async Task<int> AsignarContratosMasivoAsync(string usuario, int cantidad)
    {
        if (cantidad <= 0 || string.IsNullOrWhiteSpace(usuario)) return 0;

        var cutoff = new DateTime(2020, 1, 1);
        var contratosDisponibles = await _db.Contratos
            .Where(c => c.VigenciaHasta.HasValue && c.VigenciaHasta.Value >= cutoff)
            .Where(c => !_db.VerificacionesContratos.Any(v => v.IdMigranteContratoTrabajador == c.Id))
            .OrderBy(c => c.Id)
            .Take(cantidad)
            .Select(c => c.Id)
            .ToListAsync();

        if (contratosDisponibles.Count == 0) return 0;

        // Raw SQL INSERT to bypass trigger/OUTPUT clause issue and for performance
        var now = DateTime.Now;
        var totalInsertados = 0;
        const int batchSize = 500;
        for (int i = 0; i < contratosDisponibles.Count; i += batchSize)
        {
            var batch = contratosDisponibles.Skip(i).Take(batchSize).ToList();
            var values = string.Join(",", batch.Select((_, idx) => $"({{{idx * 2}}}, NULL, NULL, NULL, {{{idx * 2 + 1}}}, '{now:yyyy-MM-dd HH:mm:ss}')"));
            var parameters = new object[batch.Count * 2];
            for (int j = 0; j < batch.Count; j++)
            {
                parameters[j * 2] = batch[j];
                parameters[j * 2 + 1] = usuario;
            }
            var sql = $"INSERT INTO TB_VERIFICACION_CONTRATO (ID_MIGRANTE_TRABAJADOR_CONTRATO, ACLARACION, MOTIVO_ACLARACION, OBSERVACION, USUARIO_REGISTRO, FECHA_REGISTRO) VALUES {values}";
            totalInsertados += await _db.Database.ExecuteSqlRawAsync(sql, parameters);
        }
        return totalInsertados;
    }

    public async Task<(bool ok, string? error)> AsignarContratoUnicoAsync(string usuario, long contratoId)
    {
        if (string.IsNullOrWhiteSpace(usuario) || contratoId <= 0)
            return (false, "Usuario y contrato son requeridos.");

        var contrato = await _db.Contratos.FirstOrDefaultAsync(c => c.Id == contratoId);
        if (contrato == null)
            return (false, "Este contrato no existe en la base de datos o ya ha sido asignado a un revisor.");

        var yaAsignado = await _db.VerificacionesContratos.AnyAsync(v => v.IdMigranteContratoTrabajador == contratoId);
        if (yaAsignado)
            return (false, "Este contrato no existe en la base de datos o ya ha sido asignado a un revisor.");

        // Raw SQL to bypass trigger/OUTPUT clause issue
        await _db.Database.ExecuteSqlRawAsync(
            "INSERT INTO TB_VERIFICACION_CONTRATO (ID_MIGRANTE_TRABAJADOR_CONTRATO, ACLARACION, MOTIVO_ACLARACION, OBSERVACION, USUARIO_REGISTRO, FECHA_REGISTRO) VALUES ({0}, NULL, NULL, NULL, {1}, {2})",
            contratoId, usuario, DateTime.Now);
        return (true, null);
    }

    public async Task<List<object>> GetMotivosAclaracionAsync()
    {
        var motivos = await _db.CodigosReferencia
            .Where(c => c.Grupo == GruposCodigoReferencia.Aclaracion)
            .OrderBy(c => c.OrdenPresentacion)
            .Select(c => (object)new { label = c.Nombre, value = c.Codigo })
            .ToListAsync();
        return motivos;
    }
}
