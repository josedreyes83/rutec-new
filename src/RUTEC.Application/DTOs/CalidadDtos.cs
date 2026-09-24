namespace RUTEC.Application.DTOs;

public record EmpresaVerificacionDto(
    long IdOrganizacion, string? NombreOrganizacion,
    int TotalContratos, int ContratosPendientes, int ContratosAprobados
);

public record ContratoVerificacionDto(
    long ContratoId, long TrabajadorId,
    string? NombreTrabajador, string? CedulaExtranjeria,
    string? CargoTrabajador, DateTime? VigenciaDesde, DateTime? VigenciaHasta,
    string? Aclaracion, string? MotivoAclaracion, string? Observacion,
    string? UsuarioVerificador, DateTime? FechaVerificacion,
    bool AlertaDias, bool AlertaModificado
);

public record VerificadorGestionDto(
    string UsuarioRegistro, int RegistrosTotales, int RegistrosProcesados, int RegistrosPendientes
);

public record ContratoGestionDto(
    long ContratoId, string? NombreOrganizacion, string? DocTrabajador,
    string? NombreTrabajador, int CantidadIdiomas, int CantidadEstudios,
    string? Aclaracion, string? Observacion,
    DateTime? FechaGestion, string? MotivosTexto,
    bool AlertaDias, bool AlertaModificado
);

public record AsignarVerificadorDto(string UsuarioVerificador);
public record RegistrarAclaracionDto(string Aclaracion, string? MotivoAclaracion, string? Observacion);
public record AsignarContratosMasivoDto(string Usuario, int Cantidad);
