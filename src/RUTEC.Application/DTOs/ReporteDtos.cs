namespace RUTEC.Application.DTOs;

public record ReporteGeneralDto(int TotalOrganizaciones, int TotalTrabajadores, int TotalContratos);
public record ReporteItemDto(string? Categoria, int Cantidad);
public record ReporteEmpresaRegistradaDto(long IdOrganizacion, string? NombreOrganizacion, int CantidadTrabajadores, DateTime? FechaPrimerRegistro);
public record ReporteDetalleTrabajadorDto(
    long Id, string? NombreCompleto, string? CedulaExtranjeria, string? Genero,
    string? Nacionalidad, string? NivelAcademico, long? IdOrganizacion, DateTime? FechaRegistro
);
public record ReporteRueGeneralDto(string? Categoria, int Cantidad, string? Periodo);
