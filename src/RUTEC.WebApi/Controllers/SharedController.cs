using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using RUTEC.Infrastructure.Data;

namespace RUTEC.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SharedController : ControllerBase
{
    private readonly RutecDbContext _db;
    private readonly RueReadOnlyDbContext _rueDb;
    private readonly IMemoryCache _cache;

    public SharedController(RutecDbContext db, RueReadOnlyDbContext rueDb, IMemoryCache cache)
    {
        _db = db;
        _rueDb = rueDb;
        _cache = cache;
    }

    [HttpGet("departamentos")]
    public async Task<IActionResult> GetDepartamentos()
    {
        var data = await _cache.GetOrCreateAsync("departamentos", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return await _db.Departamentos
                .OrderBy(d => d.Nombre)
                .Select(d => new { d.Codigo, d.Nombre })
                .ToListAsync();
        });
        return Ok(data);
    }

    [HttpGet("municipios")]
    public async Task<IActionResult> GetMunicipios([FromQuery] string? depto)
    {
        var query = _db.Municipios.AsQueryable();
        if (!string.IsNullOrEmpty(depto))
            query = query.Where(m => m.DepartamentoId == depto);
        var data = await query.OrderBy(m => m.Nombre)
            .Select(m => new { m.Codigo, m.Nombre, Departamento = m.DepartamentoId })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("paises")]
    public async Task<IActionResult> GetPaises()
    {
        var data = await _cache.GetOrCreateAsync("paises", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return await _db.Paises
                .OrderBy(p => p.Nombre)
                .Select(p => new { p.Codigo, p.Nombre })
                .ToListAsync();
        });
        return Ok(data);
    }

    [HttpGet("codigos-referencia")]
    public async Task<IActionResult> GetCodigosReferencia([FromQuery] string? grupo)
    {
        var query = _db.CodigosReferencia.AsQueryable();
        if (!string.IsNullOrEmpty(grupo))
            query = query.Where(c => c.Grupo == grupo);
        var data = await query.OrderBy(c => c.OrdenPresentacion)
            .Select(c => new { c.Id, c.Codigo, c.Nombre, c.Grupo })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("ocupaciones-laborales")]
    public async Task<IActionResult> GetOcupacionesLaborales([FromQuery] int? nivel, [FromQuery] string? padre)
    {
        var query = _db.OcupacionesLaborales.AsQueryable();
        if (nivel.HasValue)
            query = query.Where(o => o.NivelOcupacionLaboral == nivel);
        if (!string.IsNullOrEmpty(padre))
            query = query.Where(o => o.CodigoOcupacionLaboralPadre == padre);
        var data = await query.OrderBy(o => o.NombreOcupacionLaboral)
            .Select(o => new { o.CodigoOcupacionLaboral, o.NombreOcupacionLaboral, o.NivelOcupacionLaboral })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("entidades-seguridad-social")]
    public async Task<IActionResult> GetEntidadesSeguridadSocial([FromQuery] string? tipo)
    {
        var query = _db.EntidadesSeguridadSocial.AsQueryable();
        if (!string.IsNullOrEmpty(tipo))
            query = query.Where(e => e.CodigoTipoSeguridadSocial == tipo);
        var data = await query.OrderBy(e => e.RazonSocial)
            .Select(e => new { e.Id, e.CodigoEntidad, e.RazonSocial, e.CodigoTipoSeguridadSocial })
            .ToListAsync();
        return Ok(data);
    }

    [HttpGet("mi-organizacion")]
    public async Task<IActionResult> GetMiOrganizacion()
    {
        // Get the user's organization from RUTEC trabajadores
        var userName = User.Identity?.Name;
        var primerTrabajador = await _db.MigrantesTrabajadores
            .OrderBy(t => t.Id)
            .Select(t => t.IdOrganizacion)
            .FirstOrDefaultAsync();
        if (primerTrabajador == 0) return Ok(new { nombreOrganizacion = (string?)null });
        return await GetDatosOrganizacion(primerTrabajador);
    }

    [HttpGet("organizacion/{idOrganizacion}")]
    public async Task<IActionResult> GetDatosOrganizacion(long idOrganizacion)
    {
        var org = await _rueDb.Organizaciones
            .FirstOrDefaultAsync(o => o.IdOrganizacion == idOrganizacion);
        if (org == null) return NotFound();

        var actividad = await _rueDb.ActividadesEconomicas
            .FirstOrDefaultAsync(a => a.CodigoActividad == org.CodigoActividad);

        var rep = await _rueDb.Representantes
            .FirstOrDefaultAsync(r => r.IdOrganizacion == idOrganizacion);

        string? tipoDocRepresentante = null;
        if (rep?.CodigoDocId != null)
        {
            var codRef = await _rueDb.CodigosReferencia.FindAsync(rep.CodigoDocId);
            tipoDocRepresentante = codRef?.CodigoReferencia;
        }

        return Ok(new
        {
            nombreOrganizacion = org.NombreCompleto,
            actividadEconomica = actividad?.NombreActividad,
            numeroDocumento = $"{org.ValorDocId} - {org.DigitoChequeo}",
            representante = rep == null ? null : new
            {
                nombreCompleto = $"{rep.PrimerNombre} {rep.SegundoNombre} {rep.PrimerApellido} {rep.SegundoApellido}".Trim(),
                documentoIdentificacion = $"{tipoDocRepresentante} - {rep.ValorDocId}"
            }
        });
    }
}
