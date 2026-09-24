namespace RUTEC.Domain.Entities;

public class ContratoNivelEducativo
{
    public long Id { get; set; }
    public long IdTrabajadorMigrante { get; set; }
    public long? CodigoNivelEducativo { get; set; }
    public long? SemestresCursados { get; set; }
    public string? ObtuvoTituloEducativo { get; set; }
    public string? TituloNivelEducativo { get; set; }
    public DateTime? FechaRegistro { get; set; }
    public string? UsuarioRegistro { get; set; }

    public MigranteTrabajador? MigranteTrabajador { get; set; }
}
