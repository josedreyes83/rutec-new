namespace RUTEC.Application.DTOs;

public record ContratoListDto(
    long Id, long IdMigranteTrabajador, string? DenominacionContrato,
    string? TipoContratoDescripcion, string? CargoTrabajador,
    DateTime? VigenciaDesde, DateTime? VigenciaHasta,
    bool Eliminado, string? Aclaracion
);

public record ContratoDetailDto(
    long Id, long IdMigranteTrabajador, long? IdOrganizacion,
    string? DenominacionContrato, string? TipoContratoTrabajador, string? TipoContratoDescripcion,
    string? CargoTrabajador, DateTime? VigenciaDesde, DateTime? VigenciaHasta,
    string? CodigoOcupacionLaboral1, string? OcupacionLaboral1Nombre,
    string? CodigoOcupacionLaboral2, string? OcupacionLaboral2Nombre,
    string? CodigoOcupacionLaboral3, string? OcupacionLaboral3Nombre,
    string? CodigoDepto, string? DeptoNombre,
    string? CodigoMpio, string? MpioNombre,
    string? Profesion, string? TarjetaProfesional,
    string? DescripcionContrato,
    string? EntidadPensionNombre, string? EntidadSaludNombre,
    string? EntidadRiesgosNombre, string? EntidadCajaNombre,
    bool Eliminado, string? MotivoEliminado,
    DateTime? FechaRegistro
);

public record CrearContratoDto(
    string? DenominacionContrato, string? TipoContratoTrabajador,
    string? CargoTrabajador, DateTime VigenciaDesde, DateTime VigenciaHasta,
    string? CodigoOcupacionLaboral1, string? CodigoOcupacionLaboral2, string? CodigoOcupacionLaboral3,
    string? CodigoDepto, string? CodigoMpio,
    string? Profesion, string? TarjetaProfesional,
    string? DescripcionContrato,
    string? CodigoEntidadPension, string? CodigoEntidadSalud,
    string? CodigoEntidadRiesgos, string? CodigoEntidadCaja
);

public record ModificarContratoDto(
    string? DenominacionContrato, string? TipoContratoTrabajador,
    string? CargoTrabajador, DateTime? VigenciaDesde, DateTime? VigenciaHasta,
    string? CodigoDepto, string? CodigoMpio,
    string? DescripcionContrato
);

public record EliminarContratoDto(string MotivoEliminado);
