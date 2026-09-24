namespace RUTEC.Application.DTOs;

public record CertificadoInfoDto(
    long ContratoId, long TrabajadorId,
    string? NombreCompleto, string? NumeroCedulaExtranjeria,
    string? PaisNacimiento, string? CodigoPaisNacimiento,
    string? DenominacionContrato, string? CargoTrabajador,
    string? TipoContrato, DateTime? VigenciaDesde, DateTime? VigenciaHasta,
    string? NombreOrganizacion, bool EsComunidadAndina
);

public record GenerarCertificadoResult(bool Ok, string? Error, byte[]? PdfBytes, string NombreArchivo);
