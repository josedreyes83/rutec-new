namespace RUTEC.Domain.Entities;

public class ContratoIdioma
{
    public long Id { get; set; }
    public long IdTrabajadorMigrante { get; set; }
    public long? CodigoIdioma { get; set; }
    public long? CodigoNivelHablado { get; set; }
    public long? CodigoNivelEscrito { get; set; }
    public long? CodigoNivelLeido { get; set; }
    public DateTime? FechaRegistro { get; set; }
    public string? UsuarioRegistro { get; set; }

    public MigranteTrabajador? MigranteTrabajador { get; set; }
}
