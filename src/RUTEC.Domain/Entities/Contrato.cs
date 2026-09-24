namespace RUTEC.Domain.Entities;

public class Contrato
{
    public long Id { get; set; }
    public long? IdMigranteTrabajador { get; set; }
    public long? IdOrganizacion { get; set; }
    public string? DenominacionContrato { get; set; }
    public string? TipoContratoTrabajador { get; set; }
    public string? CargoTrabajador { get; set; }
    public DateTime? VigenciaDesde { get; set; }
    public DateTime? VigenciaHasta { get; set; }
    public string? CodigoOcupacionLaboral1 { get; set; }
    public string? CodigoOcupacionLaboral2 { get; set; }
    public string? CodigoOcupacionLaboral3 { get; set; }
    public string? CodigoDepto { get; set; }
    public string? CodigoMpio { get; set; }
    public string? Profesion { get; set; }
    public string? TarjetaProfesional { get; set; }
    public string? DescripcionContrato { get; set; }
    public string? CodigoEntidadPension { get; set; }
    public string? CodigoEntidadSalud { get; set; }
    public string? CodigoEntidadRiesgos { get; set; }
    public string? CodigoEntidadCaja { get; set; }
    public DateTime? FechaRegistro { get; set; }
    public string? UsuarioRegistro { get; set; }
    public DateTime? FechaModificacion { get; set; }
    public string? UsuarioModificacion { get; set; }
    public bool Eliminado { get; set; }
    public string? MotivoEliminado { get; set; }

    public MigranteTrabajador? MigranteTrabajador { get; set; }
    public ICollection<VerificacionContrato> Verificaciones { get; set; } = [];
}
