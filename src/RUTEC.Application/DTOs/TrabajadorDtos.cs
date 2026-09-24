namespace RUTEC.Application.DTOs;

public record TrabajadorListDto(
    long Id, string? NumeroCedulaExtranjeria, string? PrimerNombre, string? PrimerApellido,
    string? SegundoNombre, string? SegundoApellido, string? CodigoGenero, string? GeneroDescripcion,
    string? PaisNacimientoNombre, long IdOrganizacion, DateTime? FechaRegistro
);

public record TrabajadorDetailDto(
    long Id, long IdOrganizacion, string? NumeroCedulaExtranjeria,
    string? NumeroPasaporte,
    string? PrimerNombre, string? SegundoNombre,
    string? PrimerApellido, string? SegundoApellido,
    string? CodigoGenero, string? GeneroDescripcion,
    string? CodigoEstadoCivil, string? EstadoCivilDescripcion,
    DateTime? FechaNacimiento,
    string? CodigoPaisNacimiento, string? PaisNacimientoNombre,
    string? CodigoPaisCiudadania, string? PaisCiudadaniaNombre,
    long? TipoDeVisa, string? TipoVisaDescripcion,
    string? TipoDocumento,
    DateTime? FechaRegistro,
    List<IdiomaDto> Idiomas,
    List<NivelEducativoDto> NivelesEducativos,
    int CantidadContratos
);

public record IdiomaDto(long Id, string? Idioma, string? NivelHablado, string? NivelEscrito, string? NivelLeido);
public record NivelEducativoDto(long Id, string? NivelEducativo, long? SemestresCursados, string? ObtuvoTitulo, string? Titulo);

public record CrearTrabajadorDto(
    string NumeroCedulaExtranjeria,
    string? NumeroPasaporte,
    string PrimerNombre, string? SegundoNombre,
    string PrimerApellido, string? SegundoApellido,
    string? CodigoGenero, string? CodigoEstadoCivil,
    DateTime? FechaNacimiento,
    string? CodigoPaisNacimiento, string? CodigoPaisCiudadania,
    long? TipoDeVisa, string? TipoDocumento,
    List<CrearIdiomaDto>? Idiomas,
    List<CrearNivelEducativoDto>? NivelesEducativos
);

public record CrearIdiomaDto(long CodigoIdioma, long? CodigoNivelHablado, long? CodigoNivelEscrito, long? CodigoNivelLeido);
public record CrearNivelEducativoDto(long CodigoNivelEducativo, long? SemestresCursados, string? ObtuvoTitulo, string? Titulo);

public record ModificarTrabajadorDto(
    string? PrimerNombre, string? SegundoNombre,
    string? PrimerApellido, string? SegundoApellido,
    string? CodigoGenero, string? CodigoEstadoCivil,
    DateTime? FechaNacimiento,
    string? CodigoPaisNacimiento, string? CodigoPaisCiudadania,
    long? TipoDeVisa
);

public record ModificarDocumentoDto(string? NumeroCedulaExtranjeria, string? NumeroPasaporte, string? TipoDocumento);

public record TrabajadorFiltroDto(string? Cedula, string? Nombre, long? IdOrganizacion, int Page = 1, int PageSize = 20);
