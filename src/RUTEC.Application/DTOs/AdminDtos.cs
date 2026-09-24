namespace RUTEC.Application.DTOs;

public record UsuarioListDto(string Id, string? UserName, string? Email, string? NombreCompleto, bool Activo, DateTime? UltimoAcceso, IList<string> Roles);
public record CodigoReferenciaDto(long Id, string? Codigo, string? Nombre, string? Grupo, string? Dominio, short? OrdenPresentacion);
public record CrearCodigoReferenciaDto(string Codigo, string Nombre, string Grupo, string? Dominio, short? OrdenPresentacion);
public record ModificarCodigoReferenciaDto(string? Codigo, string? Nombre, string? Dominio, short? OrdenPresentacion);
public record EmpresaRutecDto(long IdOrganizacion, int CantidadTrabajadores, int CantidadContratos, DateTime? FechaPrimerRegistro);
public record ContratoAdminDto(long Id, long TrabajadorId, string? NombreTrabajador, string? CedulaExtranjeria, string? Cargo, DateTime? VigenciaDesde, DateTime? VigenciaHasta, bool Eliminado);
public record ModificarFechasContratoDto(DateTime VigenciaDesde, DateTime VigenciaHasta);
public record EliminacionMasivaRequest(List<long> TrabajadorIds);
public record EliminacionMasivaResult(int Eliminados, int Errores, List<string>? Detalles);
