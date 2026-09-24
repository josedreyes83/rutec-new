using RUTEC.Application.DTOs;

namespace RUTEC.Application.Services;

public interface ICalidadService
{
    Task<List<EmpresaVerificacionDto>> GetEmpresasAsync();
    Task<List<EmpresaVerificacionDto>> GetEmpresasPendientesAsync();
    Task<List<EmpresaVerificacionDto>> GetEmpresasAprobadasAsync();
    Task<List<ContratoVerificacionDto>> GetContratosEmpresaAsync(long idOrganizacion);
    Task<bool> AsignarVerificadorAsync(long contratoId, AsignarVerificadorDto dto);
    Task<bool> RegistrarVerificacionAsync(long contratoId, RegistrarAclaracionDto dto, string usuario);
    Task<List<VerificadorGestionDto>> GetVerificadoresAsync();
    Task<List<ContratoGestionDto>> GetContratosGestionAsync(string estado, string? verificador = null);
    Task<List<object>> GetContratosVerificadorAsync(string usuario);
    Task<bool> EliminarVerificacionAsync(long id);
    Task<object?> GetContratoDetalleVerificacionAsync(long contratoId);
    Task<List<object>> GetMotivosAclaracionAsync();
    Task<int> GetContratosDisponiblesCountAsync();
    Task<int> AsignarContratosMasivoAsync(string usuario, int cantidad);
    Task<(bool ok, string? error)> AsignarContratoUnicoAsync(string usuario, long contratoId);
}
