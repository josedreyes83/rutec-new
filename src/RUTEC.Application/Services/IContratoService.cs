using RUTEC.Application.DTOs;

namespace RUTEC.Application.Services;

public interface IContratoService
{
    Task<List<ContratoListDto>> GetByTrabajadorAsync(long trabajadorId);
    Task<ContratoDetailDto?> GetByIdAsync(long id);
    Task<long> CrearAsync(long trabajadorId, CrearContratoDto dto, long idOrganizacion, string usuarioRegistro);
    Task<bool> ModificarAsync(long id, ModificarContratoDto dto, string usuarioModificacion);
    Task<bool> FinalizarAsync(long id, string usuarioModificacion);
    Task<bool> EliminarAsync(long id, EliminarContratoDto dto, string usuarioModificacion);
    Task<bool> ModificarFechasAsync(long id, DateTime vigenciaDesde, DateTime vigenciaHasta, string usuarioModificacion);
}
