using Microsoft.EntityFrameworkCore;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;
using RUTEC.Domain.Entities;
using RUTEC.Infrastructure.Data;

namespace RUTEC.Infrastructure.Services;

public class ContratoServiceImpl : IContratoService
{
    private readonly RutecDbContext _db;

    public ContratoServiceImpl(RutecDbContext db)
    {
        _db = db;
    }

    public async Task<List<ContratoListDto>> GetByTrabajadorAsync(long trabajadorId)
    {
        return await _db.Contratos
            .Where(c => c.IdMigranteTrabajador == trabajadorId)
            .OrderByDescending(c => c.FechaRegistro)
            .Select(c => new ContratoListDto(
                c.Id, c.IdMigranteTrabajador ?? 0, c.DenominacionContrato,
                null, c.CargoTrabajador,
                c.VigenciaDesde, c.VigenciaHasta,
                c.Eliminado,
                c.Verificaciones.OrderByDescending(v => v.FechaRegistro).Select(v => v.Aclaracion).FirstOrDefault()
            ))
            .ToListAsync();
    }

    public async Task<ContratoDetailDto?> GetByIdAsync(long id)
    {
        var c = await _db.Contratos.FirstOrDefaultAsync(c => c.Id == id);
        if (c == null) return null;

        var codigos = await _db.CodigosReferencia.ToListAsync();
        var deptos = await _db.Departamentos.ToListAsync();
        var mpios = await _db.Municipios.ToListAsync();
        var ocupaciones = await _db.OcupacionesLaborales.ToListAsync();
        var entidades = await _db.EntidadesSeguridadSocial.ToListAsync();

        string? Ref(string? codigo, string grupo) =>
            codigos.FirstOrDefault(r => r.Codigo == codigo && r.Grupo == grupo)?.Nombre;

        return new ContratoDetailDto(
            c.Id, c.IdMigranteTrabajador ?? 0, c.IdOrganizacion,
            c.DenominacionContrato, c.TipoContratoTrabajador,
            Ref(c.TipoContratoTrabajador, "CODTIPOCONTRATO"),
            c.CargoTrabajador, c.VigenciaDesde, c.VigenciaHasta,
            c.CodigoOcupacionLaboral1, ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == c.CodigoOcupacionLaboral1)?.NombreOcupacionLaboral,
            c.CodigoOcupacionLaboral2, ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == c.CodigoOcupacionLaboral2)?.NombreOcupacionLaboral,
            c.CodigoOcupacionLaboral3, ocupaciones.FirstOrDefault(o => o.CodigoOcupacionLaboral == c.CodigoOcupacionLaboral3)?.NombreOcupacionLaboral,
            c.CodigoDepto, deptos.FirstOrDefault(d => d.Codigo == c.CodigoDepto)?.Nombre,
            c.CodigoMpio, mpios.FirstOrDefault(m => m.Codigo == c.CodigoMpio)?.Nombre,
            c.Profesion, c.TarjetaProfesional, c.DescripcionContrato,
            entidades.FirstOrDefault(e => e.CodigoEntidad == c.CodigoEntidadPension)?.RazonSocial,
            entidades.FirstOrDefault(e => e.CodigoEntidad == c.CodigoEntidadSalud)?.RazonSocial,
            entidades.FirstOrDefault(e => e.CodigoEntidad == c.CodigoEntidadRiesgos)?.RazonSocial,
            entidades.FirstOrDefault(e => e.CodigoEntidad == c.CodigoEntidadCaja)?.RazonSocial,
            c.Eliminado, c.MotivoEliminado, c.FechaRegistro
        );
    }

    public async Task<long> CrearAsync(long trabajadorId, CrearContratoDto dto, long idOrganizacion, string usuarioRegistro)
    {
        var contrato = new Contrato
        {
            IdMigranteTrabajador = trabajadorId,
            IdOrganizacion = idOrganizacion,
            DenominacionContrato = dto.DenominacionContrato,
            TipoContratoTrabajador = dto.TipoContratoTrabajador,
            CargoTrabajador = dto.CargoTrabajador,
            VigenciaDesde = dto.VigenciaDesde,
            VigenciaHasta = dto.VigenciaHasta,
            CodigoOcupacionLaboral1 = dto.CodigoOcupacionLaboral1,
            CodigoOcupacionLaboral2 = dto.CodigoOcupacionLaboral2,
            CodigoOcupacionLaboral3 = dto.CodigoOcupacionLaboral3,
            CodigoDepto = dto.CodigoDepto,
            CodigoMpio = dto.CodigoMpio,
            Profesion = dto.Profesion,
            TarjetaProfesional = dto.TarjetaProfesional,
            DescripcionContrato = dto.DescripcionContrato,
            CodigoEntidadPension = dto.CodigoEntidadPension,
            CodigoEntidadSalud = dto.CodigoEntidadSalud,
            CodigoEntidadRiesgos = dto.CodigoEntidadRiesgos,
            CodigoEntidadCaja = dto.CodigoEntidadCaja,
            FechaRegistro = DateTime.Now,
            UsuarioRegistro = usuarioRegistro,
            Eliminado = false
        };

        _db.Contratos.Add(contrato);
        await _db.SaveChangesAsync();
        return contrato.Id;
    }

    public async Task<bool> ModificarAsync(long id, ModificarContratoDto dto, string usuarioModificacion)
    {
        var c = await _db.Contratos.FindAsync(id);
        if (c == null || c.Eliminado) return false;

        if (dto.DenominacionContrato != null) c.DenominacionContrato = dto.DenominacionContrato;
        if (dto.TipoContratoTrabajador != null) c.TipoContratoTrabajador = dto.TipoContratoTrabajador;
        if (dto.CargoTrabajador != null) c.CargoTrabajador = dto.CargoTrabajador;
        if (dto.VigenciaDesde.HasValue) c.VigenciaDesde = dto.VigenciaDesde;
        if (dto.VigenciaHasta.HasValue) c.VigenciaHasta = dto.VigenciaHasta;
        if (dto.CodigoDepto != null) c.CodigoDepto = dto.CodigoDepto;
        if (dto.CodigoMpio != null) c.CodigoMpio = dto.CodigoMpio;
        if (dto.DescripcionContrato != null) c.DescripcionContrato = dto.DescripcionContrato;

        c.UsuarioModificacion = usuarioModificacion;
        c.FechaModificacion = DateTime.Now;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> FinalizarAsync(long id, string usuarioModificacion)
    {
        var c = await _db.Contratos.FindAsync(id);
        if (c == null || c.Eliminado) return false;

        c.VigenciaHasta = DateTime.Now;
        c.UsuarioModificacion = usuarioModificacion;
        c.FechaModificacion = DateTime.Now;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(long id, EliminarContratoDto dto, string usuarioModificacion)
    {
        var c = await _db.Contratos.FindAsync(id);
        if (c == null) return false;

        c.Eliminado = true;
        c.MotivoEliminado = dto.MotivoEliminado;
        c.UsuarioModificacion = usuarioModificacion;
        c.FechaModificacion = DateTime.Now;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ModificarFechasAsync(long id, DateTime vigenciaDesde, DateTime vigenciaHasta, string usuarioModificacion)
    {
        var c = await _db.Contratos.FindAsync(id);
        if (c == null) return false;

        c.VigenciaDesde = vigenciaDesde;
        c.VigenciaHasta = vigenciaHasta;
        c.UsuarioModificacion = usuarioModificacion;
        c.FechaModificacion = DateTime.Now;

        await _db.SaveChangesAsync();
        return true;
    }
}
