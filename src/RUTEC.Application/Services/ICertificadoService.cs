using RUTEC.Application.DTOs;

namespace RUTEC.Application.Services;

public interface ICertificadoService
{
    Task<List<CertificadoInfoDto>> GetByTrabajadorAsync(long trabajadorId);
    Task<CertificadoInfoDto?> GetInfoContratoAsync(long contratoId);
    Task<GenerarCertificadoResult> GenerarConstanciaAsync(long contratoId);
}
