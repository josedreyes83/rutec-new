using RUTEC.Application.DTOs;

namespace RUTEC.Application.Services;

public interface IAdminService
{
    Task<List<UsuarioListDto>> GetUsuariosAsync();
    Task<UsuarioListDto?> GetUsuarioByIdAsync(string id);
    Task<List<CodigoReferenciaDto>> GetCodigosReferenciaAsync(string? grupo);
    Task<long> CrearCodigoReferenciaAsync(CrearCodigoReferenciaDto dto);
    Task<bool> ModificarCodigoReferenciaAsync(long id, ModificarCodigoReferenciaDto dto);
    Task<bool> EliminarCodigoReferenciaAsync(long id);
    Task<List<EmpresaRutecDto>> GetEmpresasAsync();
    Task<List<ContratoAdminDto>> GetContratosEmpresaAsync(long idOrganizacion);
    Task<ContratoAdminDto?> GetContratoByIdAsync(long id);
    Task<object?> GetContratoFullForModificarFechasAsync(long id);
    Task<bool> ModificarFechasContratoAsync(long id, ModificarFechasContratoDto dto, string usuario);
    Task<EliminacionMasivaResult> EliminarMasivoAsync(EliminacionMasivaRequest request);

    // Eliminación individual por tipo
    Task<List<object>> ListarContratosParaEliminarAsync();
    Task<bool> EliminarContratoDirectoAsync(long id);
    Task<List<object>> ListarTrabajadoresParaEliminarAsync();
    Task<bool> EliminarTrabajadorDirectoAsync(long id);
    Task<List<object>> ListarIdiomasParaEliminarAsync();
    Task<bool> EliminarIdiomaDirectoAsync(long id);
    Task<List<object>> ListarNivelesParaEliminarAsync();
    Task<bool> EliminarNivelDirectoAsync(long id);
}
