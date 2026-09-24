using RUTEC.Application.Common.Models;
using RUTEC.Application.DTOs;

namespace RUTEC.Application.Services;

public interface ITrabajadorService
{
    Task<PaginatedList<TrabajadorListDto>> GetAllAsync(TrabajadorFiltroDto filtro);
    Task<TrabajadorDetailDto?> GetByIdAsync(long id);
    Task<TrabajadorDetailDto?> BuscarPorCedulaAsync(string cedula);
    Task<long> CrearAsync(CrearTrabajadorDto dto, long idOrganizacion, string usuarioRegistro);
    Task<bool> ModificarAsync(long id, ModificarTrabajadorDto dto);
    Task<bool> ModificarDocumentoAsync(long id, ModificarDocumentoDto dto);
}
