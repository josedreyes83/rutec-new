using Microsoft.EntityFrameworkCore;
using RUTEC.Application.Common.Models;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;
using RUTEC.Domain.Constants;
using RUTEC.Domain.Entities;
using RUTEC.Infrastructure.Data;

namespace RUTEC.Infrastructure.Services;

public class TrabajadorServiceImpl : ITrabajadorService
{
    private readonly RutecDbContext _db;

    public TrabajadorServiceImpl(RutecDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedList<TrabajadorListDto>> GetAllAsync(TrabajadorFiltroDto filtro)
    {
        var query = _db.MigrantesTrabajadores.AsQueryable();

        if (!string.IsNullOrEmpty(filtro.Cedula))
            query = query.Where(t => t.NumeroCedulaExtranjeria!.Contains(filtro.Cedula));
        if (!string.IsNullOrEmpty(filtro.Nombre))
            query = query.Where(t => (t.PrimerNombre + " " + t.PrimerApellido).Contains(filtro.Nombre));
        if (filtro.IdOrganizacion.HasValue)
            query = query.Where(t => t.IdOrganizacion == filtro.IdOrganizacion);

        var projected = query.OrderByDescending(t => t.FechaRegistro)
            .Select(t => new TrabajadorListDto(
                t.Id, t.NumeroCedulaExtranjeria, t.PrimerNombre, t.PrimerApellido,
                t.SegundoNombre, t.SegundoApellido, t.CodigoGenero, null,
                null, t.IdOrganizacion, t.FechaRegistro
            ));

        return await PaginatedList<TrabajadorListDto>.CreateAsync(projected, filtro.Page, filtro.PageSize);
    }

    public async Task<TrabajadorDetailDto?> GetByIdAsync(long id)
    {
        var t = await _db.MigrantesTrabajadores
            .Include(t => t.Idiomas)
            .Include(t => t.NivelesEducativos)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (t == null) return null;

        var refs = new CodigoReferenciaResolver(await _db.CodigosReferencia.ToListAsync());
        var paises = await _db.Paises.ToListAsync();

        string? PaisNombre(string? codigo) =>
            paises.FirstOrDefault(p => p.Codigo == codigo)?.Nombre;

        var cantContratos = await _db.Contratos.CountAsync(c => c.IdMigranteTrabajador == id && !c.Eliminado);

        return new TrabajadorDetailDto(
            t.Id, t.IdOrganizacion, t.NumeroCedulaExtranjeria,
            t.NumeroPasaporte,
            t.PrimerNombre, t.SegundoNombre, t.PrimerApellido, t.SegundoApellido,
            t.CodigoGenero, refs.Describir(t.CodigoGenero, GruposCodigoReferencia.Genero),
            t.CodigoEstadoCivil, refs.Describir(t.CodigoEstadoCivil, GruposCodigoReferencia.EstadoCivil),
            t.FechaNacimiento,
            t.CodigoPaisNacimiento, PaisNombre(t.CodigoPaisNacimiento),
            t.CodigoPaisCiudadania, PaisNombre(t.CodigoPaisCiudadania),
            t.TipoDeVisa, refs.Describir(t.TipoDeVisa, GruposCodigoReferencia.TipoVisa),
            t.TipoDocumento, t.FechaRegistro,
            t.Idiomas.Select(i => new IdiomaDto(
                i.Id,
                refs.Describir(i.CodigoIdioma, GruposCodigoReferencia.TipoIdioma),
                refs.Describir(i.CodigoNivelHablado, GruposCodigoReferencia.CalificacionIdioma),
                refs.Describir(i.CodigoNivelEscrito, GruposCodigoReferencia.CalificacionIdioma),
                refs.Describir(i.CodigoNivelLeido, GruposCodigoReferencia.CalificacionIdioma)
            )).ToList(),
            t.NivelesEducativos.Select(n => new NivelEducativoDto(
                n.Id,
                refs.Describir(n.CodigoNivelEducativo, GruposCodigoReferencia.NivelEducativo),
                n.SemestresCursados, n.ObtuvoTituloEducativo, n.TituloNivelEducativo
            )).ToList(),
            cantContratos
        );
    }

    public async Task<TrabajadorDetailDto?> BuscarPorCedulaAsync(string cedula)
    {
        var t = await _db.MigrantesTrabajadores
            .FirstOrDefaultAsync(t => t.NumeroCedulaExtranjeria == cedula);
        if (t == null) return null;
        return await GetByIdAsync(t.Id);
    }

    public async Task<long> CrearAsync(CrearTrabajadorDto dto, long idOrganizacion, string usuarioRegistro)
    {
        var trabajador = new MigranteTrabajador
        {
            IdOrganizacion = idOrganizacion,
            NumeroCedulaExtranjeria = dto.NumeroCedulaExtranjeria,
            NumeroPasaporte = dto.NumeroPasaporte,
            PrimerNombre = dto.PrimerNombre,
            SegundoNombre = dto.SegundoNombre,
            PrimerApellido = dto.PrimerApellido,
            SegundoApellido = dto.SegundoApellido,
            CodigoGenero = dto.CodigoGenero,
            CodigoEstadoCivil = dto.CodigoEstadoCivil,
            FechaNacimiento = dto.FechaNacimiento,
            CodigoPaisNacimiento = dto.CodigoPaisNacimiento,
            CodigoPaisCiudadania = dto.CodigoPaisCiudadania,
            TipoDeVisa = dto.TipoDeVisa,
            TipoDocumento = dto.TipoDocumento,
            UsuarioRegistro = usuarioRegistro,
            FechaRegistro = DateTime.Now
        };

        _db.MigrantesTrabajadores.Add(trabajador);
        await _db.SaveChangesAsync();

        if (dto.Idiomas != null)
        {
            foreach (var i in dto.Idiomas)
            {
                _db.ContratosIdiomas.Add(new ContratoIdioma
                {
                    IdTrabajadorMigrante = trabajador.Id,
                    CodigoIdioma = i.CodigoIdioma,
                    CodigoNivelHablado = i.CodigoNivelHablado,
                    CodigoNivelEscrito = i.CodigoNivelEscrito,
                    CodigoNivelLeido = i.CodigoNivelLeido,
                    FechaRegistro = DateTime.Now,
                    UsuarioRegistro = usuarioRegistro
                });
            }
        }

        if (dto.NivelesEducativos != null)
        {
            foreach (var n in dto.NivelesEducativos)
            {
                _db.ContratosNivelesEducativos.Add(new ContratoNivelEducativo
                {
                    IdTrabajadorMigrante = trabajador.Id,
                    CodigoNivelEducativo = n.CodigoNivelEducativo,
                    SemestresCursados = n.SemestresCursados,
                    ObtuvoTituloEducativo = n.ObtuvoTitulo,
                    TituloNivelEducativo = n.Titulo,
                    FechaRegistro = DateTime.Now,
                    UsuarioRegistro = usuarioRegistro
                });
            }
        }

        await _db.SaveChangesAsync();
        return trabajador.Id;
    }

    public async Task<bool> ModificarAsync(long id, ModificarTrabajadorDto dto)
    {
        var t = await _db.MigrantesTrabajadores.FindAsync(id);
        if (t == null) return false;

        if (dto.PrimerNombre != null) t.PrimerNombre = dto.PrimerNombre;
        if (dto.SegundoNombre != null) t.SegundoNombre = dto.SegundoNombre;
        if (dto.PrimerApellido != null) t.PrimerApellido = dto.PrimerApellido;
        if (dto.SegundoApellido != null) t.SegundoApellido = dto.SegundoApellido;
        if (dto.CodigoGenero != null) t.CodigoGenero = dto.CodigoGenero;
        if (dto.CodigoEstadoCivil != null) t.CodigoEstadoCivil = dto.CodigoEstadoCivil;
        if (dto.FechaNacimiento.HasValue) t.FechaNacimiento = dto.FechaNacimiento;
        if (dto.CodigoPaisNacimiento != null) t.CodigoPaisNacimiento = dto.CodigoPaisNacimiento;
        if (dto.CodigoPaisCiudadania != null) t.CodigoPaisCiudadania = dto.CodigoPaisCiudadania;
        if (dto.TipoDeVisa.HasValue) t.TipoDeVisa = dto.TipoDeVisa;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ModificarDocumentoAsync(long id, ModificarDocumentoDto dto)
    {
        var t = await _db.MigrantesTrabajadores.FindAsync(id);
        if (t == null) return false;

        if (dto.NumeroCedulaExtranjeria != null) t.NumeroCedulaExtranjeria = dto.NumeroCedulaExtranjeria;
        if (dto.NumeroPasaporte != null) t.NumeroPasaporte = dto.NumeroPasaporte;
        if (dto.TipoDocumento != null) t.TipoDocumento = dto.TipoDocumento;

        await _db.SaveChangesAsync();
        return true;
    }
}
