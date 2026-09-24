namespace RUTEC.Domain.Entities;

public class VerificacionContrato
{
    public long Id { get; set; }
    public long IdMigranteContratoTrabajador { get; set; }
    public string? Aclaracion { get; set; }
    public string? MotivoAclaracion { get; set; }
    public string? Observacion { get; set; }
    public string? UsuarioRegistro { get; set; }
    public DateTime? FechaRegistro { get; set; }

    public Contrato? Contrato { get; set; }
}
