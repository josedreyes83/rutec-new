using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;
using RUTEC.Infrastructure.Data;
using Shared.Auth.Entities;

namespace RUTEC.Infrastructure.Services;

public class AdminServiceImpl : IAdminService
{
    private readonly RutecDbContext _db;
    private readonly RueReadOnlyDbContext _rueDb;
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminServiceImpl(RutecDbContext db, RueReadOnlyDbContext rueDb, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _rueDb = rueDb;
        _userManager = userManager;
    }

    // ── Usuarios ──────────────────────────────────────────────

    public async Task<List<UsuarioListDto>> GetUsuariosAsync()
    {
        var users = await _userManager.Users
            .OrderBy(u => u.UserName)
            .ToListAsync();

        var result = new List<UsuarioListDto>(users.Count);
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            result.Add(new UsuarioListDto(u.Id, u.UserName, u.Email, u.NombreCompleto, u.Activo, u.UltimoAcceso, roles));
        }
        return result;
    }

    public async Task<UsuarioListDto?> GetUsuarioByIdAsync(string id)
    {
        var u = await _userManager.FindByIdAsync(id);
        if (u == null) return null;

        var roles = await _userManager.GetRolesAsync(u);
        return new UsuarioListDto(u.Id, u.UserName, u.Email, u.NombreCompleto, u.Activo, u.UltimoAcceso, roles);
    }

    // ── Códigos de referencia ─────────────────────────────────

    public async Task<List<CodigoReferenciaDto>> GetCodigosReferenciaAsync(string? grupo)
    {
        var query = _db.CodigosReferencia.AsQueryable();

        if (!string.IsNullOrWhiteSpace(grupo))
            query = query.Where(c => c.Grupo == grupo);

        return await query
            .OrderBy(c => c.Grupo).ThenBy(c => c.OrdenPresentacion).ThenBy(c => c.Nombre)
            .Select(c => new CodigoReferenciaDto(c.Id, c.Codigo, c.Nombre, c.Grupo, c.Dominio, c.OrdenPresentacion))
            .ToListAsync();
    }

    public async Task<long> CrearCodigoReferenciaAsync(CrearCodigoReferenciaDto dto)
    {
        var maxId = await _db.CodigosReferencia.AnyAsync()
            ? await _db.CodigosReferencia.MaxAsync(c => c.Id)
            : 0;

        var entity = new Domain.Entities.CodigoReferencia
        {
            Id = maxId + 1,
            Codigo = dto.Codigo,
            Nombre = dto.Nombre,
            Grupo = dto.Grupo,
            Dominio = dto.Dominio,
            OrdenPresentacion = dto.OrdenPresentacion
        };

        _db.CodigosReferencia.Add(entity);
        await _db.SaveChangesAsync();
        return entity.Id;
    }

    public async Task<bool> ModificarCodigoReferenciaAsync(long id, ModificarCodigoReferenciaDto dto)
    {
        var entity = await _db.CodigosReferencia.FindAsync(id);
        if (entity == null) return false;

        if (dto.Codigo != null) entity.Codigo = dto.Codigo;
        if (dto.Nombre != null) entity.Nombre = dto.Nombre;
        if (dto.Dominio != null) entity.Dominio = dto.Dominio;
        if (dto.OrdenPresentacion.HasValue) entity.OrdenPresentacion = dto.OrdenPresentacion;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarCodigoReferenciaAsync(long id)
    {
        var entity = await _db.CodigosReferencia.FindAsync(id);
        if (entity == null) return false;

        _db.CodigosReferencia.Remove(entity);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── Empresas ──────────────────────────────────────────────

    public async Task<List<EmpresaRutecDto>> GetEmpresasAsync()
    {
        return await _db.Contratos
            .Where(c => c.IdOrganizacion.HasValue)
            .GroupBy(c => c.IdOrganizacion!.Value)
            .Select(g => new EmpresaRutecDto(
                g.Key,
                g.Select(c => c.IdMigranteTrabajador).Distinct().Count(),
                g.Count(),
                g.Min(c => c.FechaRegistro)
            ))
            .OrderByDescending(e => e.CantidadContratos)
            .ToListAsync();
    }

    public async Task<List<ContratoAdminDto>> GetContratosEmpresaAsync(long idOrganizacion)
    {
        return await _db.Contratos
            .Where(c => c.IdOrganizacion == idOrganizacion)
            .Join(_db.MigrantesTrabajadores,
                c => c.IdMigranteTrabajador,
                t => t.Id,
                (c, t) => new ContratoAdminDto(
                    c.Id,
                    t.Id,
                    (t.PrimerNombre ?? "") + " " + (t.PrimerApellido ?? ""),
                    t.NumeroCedulaExtranjeria,
                    c.CargoTrabajador,
                    c.VigenciaDesde,
                    c.VigenciaHasta,
                    c.Eliminado
                ))
            .OrderByDescending(c => c.VigenciaDesde)
            .ToListAsync();
    }

    public async Task<object?> GetContratoFullForModificarFechasAsync(long id)
    {
        var contrato = await _db.Contratos.FirstOrDefaultAsync(c => c.Id == id);
        if (contrato == null) return null;

        var trabajador = contrato.IdMigranteTrabajador.HasValue
            ? await _db.MigrantesTrabajadores.FirstOrDefaultAsync(t => t.Id == contrato.IdMigranteTrabajador.Value)
            : null;

        string? docOrg = null;
        string? nombreOrg = null;
        if (contrato.IdOrganizacion.HasValue)
        {
            var org = await _rueDb.Organizaciones
                .FirstOrDefaultAsync(o => o.IdOrganizacion == contrato.IdOrganizacion.Value);
            docOrg = org?.ValorDocId;
            nombreOrg = org?.NombreCompleto;
        }

        string? tipoDocTrabajador = trabajador?.TipoDocumento;
        if (!string.IsNullOrEmpty(tipoDocTrabajador) && long.TryParse(tipoDocTrabajador, out var tdId))
            tipoDocTrabajador = (await _db.CodigosReferencia.FirstOrDefaultAsync(c => c.Id == tdId))?.Nombre ?? tipoDocTrabajador;

        return new
        {
            id = contrato.Id,
            docOrganizacion = docOrg,
            nombreOrganizacion = nombreOrg,
            tipoDocumentoTrabajador = tipoDocTrabajador,
            numeroDocumentoTrabajador = trabajador?.NumeroCedulaExtranjeria,
            nombreTrabajador = trabajador != null
                ? $"{trabajador.PrimerNombre} {trabajador.SegundoNombre} {trabajador.PrimerApellido} {trabajador.SegundoApellido}".Trim()
                : "",
            denominacionContrato = contrato.DenominacionContrato,
            cargoTrabajador = contrato.CargoTrabajador,
            vigenciaDesde = contrato.VigenciaDesde,
            vigenciaHasta = contrato.VigenciaHasta
        };
    }

    public async Task<ContratoAdminDto?> GetContratoByIdAsync(long id)
    {
        return await _db.Contratos
            .Where(c => c.Id == id)
            .Join(_db.MigrantesTrabajadores,
                c => c.IdMigranteTrabajador,
                t => t.Id,
                (c, t) => new ContratoAdminDto(
                    c.Id,
                    t.Id,
                    (t.PrimerNombre ?? "") + " " + (t.PrimerApellido ?? ""),
                    t.NumeroCedulaExtranjeria,
                    c.CargoTrabajador,
                    c.VigenciaDesde,
                    c.VigenciaHasta,
                    c.Eliminado
                ))
            .FirstOrDefaultAsync();
    }

    // ── Modificar fechas contrato ─────────────────────────────

    public async Task<bool> ModificarFechasContratoAsync(long id, ModificarFechasContratoDto dto, string usuario)
    {
        // Raw SQL to bypass trigger/OUTPUT clause issue
        var rows = await _db.Database.ExecuteSqlRawAsync(
            "UPDATE TB_MIGRANTE_TRABAJADOR_CONTRATO SET VIGENCIA_DESDE = {0}, VIGENCIA_HASTA = {1}, USUARIO_MODIFICACION = {2}, FECHA_MODIFICACION = {3} WHERE ID_MIGRANTE_TRABAJADOR_CONTRATO = {4}",
            dto.VigenciaDesde, dto.VigenciaHasta, usuario, DateTime.Now, id);
        return rows > 0;
    }

    // ── Eliminación masiva ────────────────────────────────────

    public async Task<EliminacionMasivaResult> EliminarMasivoAsync(EliminacionMasivaRequest request)
    {
        int eliminados = 0;
        int errores = 0;
        var detalles = new List<string>();

        await using var transaction = await _db.Database.BeginTransactionAsync();

        try
        {
            foreach (var trabajadorId in request.TrabajadorIds)
            {
                try
                {
                    // Delete idiomas
                    var idiomas = await _db.ContratosIdiomas
                        .Where(i => i.IdTrabajadorMigrante == trabajadorId)
                        .ToListAsync();
                    _db.ContratosIdiomas.RemoveRange(idiomas);

                    // Delete niveles educativos
                    var niveles = await _db.ContratosNivelesEducativos
                        .Where(n => n.IdTrabajadorMigrante == trabajadorId)
                        .ToListAsync();
                    _db.ContratosNivelesEducativos.RemoveRange(niveles);

                    // Delete verificaciones de contratos
                    var contratoIds = await _db.Contratos
                        .Where(c => c.IdMigranteTrabajador == trabajadorId)
                        .Select(c => c.Id)
                        .ToListAsync();

                    if (contratoIds.Count > 0)
                    {
                        var verificaciones = await _db.VerificacionesContratos
                            .Where(v => contratoIds.Contains(v.IdMigranteContratoTrabajador))
                            .ToListAsync();
                        _db.VerificacionesContratos.RemoveRange(verificaciones);
                    }

                    // Delete contratos
                    var contratos = await _db.Contratos
                        .Where(c => c.IdMigranteTrabajador == trabajadorId)
                        .ToListAsync();
                    _db.Contratos.RemoveRange(contratos);

                    // Delete trabajador
                    var trabajador = await _db.MigrantesTrabajadores.FindAsync(trabajadorId);
                    if (trabajador != null)
                    {
                        _db.MigrantesTrabajadores.Remove(trabajador);
                        eliminados++;
                        detalles.Add($"Trabajador {trabajadorId}: eliminado ({idiomas.Count} idiomas, {niveles.Count} niveles, {contratos.Count} contratos)");
                    }
                    else
                    {
                        detalles.Add($"Trabajador {trabajadorId}: no encontrado");
                        errores++;
                    }

                    await _db.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    errores++;
                    detalles.Add($"Trabajador {trabajadorId}: error - {ex.Message}");
                }
            }

            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return new EliminacionMasivaResult(0, request.TrabajadorIds.Count,
                [$"Error general en transacción: {ex.Message}"]);
        }

        return new EliminacionMasivaResult(eliminados, errores, detalles);
    }

    // Test users/orgs filter matching legacy eliminar_registros.aspx
    private static readonly string[] _testUsuarios = ["876543210", "jbulla", "dramon", "jsantos", "jsantosn", "jlopezp", "jlopez"];

    public async Task<List<object>> ListarContratosParaEliminarAsync()
    {
        var contratos = await _db.Contratos
            .Where(c => _testUsuarios.Contains(c.UsuarioRegistro))
            .OrderByDescending(c => c.FechaRegistro)
            .ToListAsync();

        var trabajadorIds = contratos.Select(c => c.IdMigranteTrabajador).Distinct().ToList();
        var trabajadores = await _db.MigrantesTrabajadores
            .Where(t => trabajadorIds.Contains(t.Id))
            .ToListAsync();

        var orgIds = contratos.Where(c => c.IdOrganizacion.HasValue).Select(c => c.IdOrganizacion!.Value).Distinct().ToList();
        var orgs = await _rueDb.Organizaciones
            .Where(o => orgIds.Contains(o.IdOrganizacion))
            .ToListAsync();

        return contratos.Select(c =>
        {
            var t = trabajadores.FirstOrDefault(t => t.Id == c.IdMigranteTrabajador);
            var org = c.IdOrganizacion.HasValue ? orgs.FirstOrDefault(o => o.IdOrganizacion == c.IdOrganizacion.Value) : null;
            return (object)new
            {
                id = c.Id,
                docOrganizacion = org?.ValorDocId ?? c.IdOrganizacion?.ToString(),
                nombreOrganizacion = org?.NombreCompleto ?? "",
                docTrabajador = t?.NumeroCedulaExtranjeria,
                trabajador = t != null ? $"{t.PrimerNombre} {t.SegundoNombre} {t.PrimerApellido} {t.SegundoApellido}".Trim() : "",
                usuarioRegistro = c.UsuarioRegistro
            };
        }).ToList();
    }

    public async Task<bool> EliminarContratoDirectoAsync(long id)
    {
        // Raw SQL to bypass OUTPUT clause issue with table triggers
        var rows = await _db.Database.ExecuteSqlRawAsync(
            "DELETE FROM TB_MIGRANTE_TRABAJADOR_CONTRATO WHERE ID_MIGRANTE_TRABAJADOR_CONTRATO = {0}", id);
        return rows > 0;
    }

    private static readonly long[] _testOrgIds = [555, 66];

    public async Task<List<object>> ListarTrabajadoresParaEliminarAsync()
    {
        return await _db.MigrantesTrabajadores
            .Where(t => _testOrgIds.Contains(t.IdOrganizacion) || _testUsuarios.Contains(t.UsuarioRegistro))
            .OrderByDescending(t => t.FechaRegistro)
            .Select(t => (object)new
            {
                id = t.Id,
                cedula = t.NumeroCedulaExtranjeria,
                nombre = t.PrimerNombre + " " + t.PrimerApellido,
                usuarioRegistro = t.UsuarioRegistro
            })
            .ToListAsync();
    }

    public async Task<bool> EliminarTrabajadorDirectoAsync(long id)
    {
        // Raw SQL to bypass OUTPUT clause issue with table triggers
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM CONTRATO_MIGRANTE_IDIOMA WHERE ID_TRABAJADOR_MIGRANTE = {0}", id);
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM CONTRATO_MIGRANTE_NIVEL_EDUCATIVO WHERE ID_TRABAJADOR_MIGRANTE = {0}", id);
        await _db.Database.ExecuteSqlRawAsync("DELETE FROM TB_MIGRANTE_TRABAJADOR_CONTRATO WHERE ID_MIGRANTE_TRABAJADOR = {0}", id);
        var rows = await _db.Database.ExecuteSqlRawAsync("DELETE FROM TB_MIGRANTE_TRABAJADOR WHERE ID_MIGRANTE_TRABAJADOR = {0}", id);
        return rows > 0;
    }

    public async Task<List<object>> ListarIdiomasParaEliminarAsync()
    {
        var testTrabajadorIds = await _db.MigrantesTrabajadores
            .Where(t => _testOrgIds.Contains(t.IdOrganizacion) || _testUsuarios.Contains(t.UsuarioRegistro))
            .Select(t => t.Id).ToListAsync();

        var idiomas = await _db.ContratosIdiomas
            .Where(i => testTrabajadorIds.Contains(i.IdTrabajadorMigrante))
            .OrderByDescending(i => i.FechaRegistro)
            .ToListAsync();

        var trabajadores = await _db.MigrantesTrabajadores
            .Where(t => testTrabajadorIds.Contains(t.Id))
            .ToListAsync();

        var idiomaIds = idiomas.Where(i => i.CodigoIdioma.HasValue).Select(i => i.CodigoIdioma!.Value).Distinct().ToList();
        var codigos = await _db.CodigosReferencia
            .Where(c => idiomaIds.Contains(c.Id))
            .ToListAsync();

        return idiomas.Select(i =>
        {
            var t = trabajadores.FirstOrDefault(t => t.Id == i.IdTrabajadorMigrante);
            var idiomaNombre = i.CodigoIdioma.HasValue ? codigos.FirstOrDefault(c => c.Id == i.CodigoIdioma.Value)?.Nombre ?? i.CodigoIdioma.ToString() : "";
            return (object)new
            {
                id = i.Id,
                numeroDocumento = t?.NumeroCedulaExtranjeria,
                nombreTrabajador = t != null ? $"{t.PrimerNombre} {t.SegundoNombre} {t.PrimerApellido} {t.SegundoApellido}".Trim() : "",
                idioma = idiomaNombre,
                usuarioRegistro = i.UsuarioRegistro
            };
        }).ToList();
    }

    public async Task<bool> EliminarIdiomaDirectoAsync(long id)
    {
        var rows = await _db.Database.ExecuteSqlRawAsync(
            "DELETE FROM CONTRATO_MIGRANTE_IDIOMA WHERE ID_MIGRANTE_IDIOMA = {0}", id);
        return rows > 0;
    }

    public async Task<List<object>> ListarNivelesParaEliminarAsync()
    {
        var testTrabajadorIds = await _db.MigrantesTrabajadores
            .Where(t => _testOrgIds.Contains(t.IdOrganizacion) || _testUsuarios.Contains(t.UsuarioRegistro))
            .Select(t => t.Id).ToListAsync();

        var niveles = await _db.ContratosNivelesEducativos
            .Where(n => testTrabajadorIds.Contains(n.IdTrabajadorMigrante))
            .OrderByDescending(n => n.FechaRegistro)
            .ToListAsync();

        var trabajadores = await _db.MigrantesTrabajadores
            .Where(t => testTrabajadorIds.Contains(t.Id))
            .ToListAsync();

        var nivelIds = niveles.Where(n => n.CodigoNivelEducativo.HasValue).Select(n => n.CodigoNivelEducativo!.Value).Distinct().ToList();
        var codigos = await _db.CodigosReferencia
            .Where(c => nivelIds.Contains(c.Id))
            .ToListAsync();

        return niveles.Select(n =>
        {
            var t = trabajadores.FirstOrDefault(t => t.Id == n.IdTrabajadorMigrante);
            var nivelNombre = n.CodigoNivelEducativo.HasValue ? codigos.FirstOrDefault(c => c.Id == n.CodigoNivelEducativo.Value)?.Nombre ?? n.CodigoNivelEducativo.ToString() : "";
            return (object)new
            {
                id = n.Id,
                numeroDocumento = t?.NumeroCedulaExtranjeria,
                nombreTrabajador = t != null ? $"{t.PrimerNombre} {t.SegundoNombre} {t.PrimerApellido} {t.SegundoApellido}".Trim() : "",
                nivelEducativo = nivelNombre,
                usuarioRegistro = n.UsuarioRegistro
            };
        }).ToList();
    }

    public async Task<bool> EliminarNivelDirectoAsync(long id)
    {
        var rows = await _db.Database.ExecuteSqlRawAsync(
            "DELETE FROM CONTRATO_MIGRANTE_NIVEL_EDUCATIVO WHERE ID_ESTUDIO_MIGRANTE = {0}", id);
        return rows > 0;
    }
}
