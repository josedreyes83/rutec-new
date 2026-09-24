namespace RUTEC.Domain.Entities;

public class MigranteTrabajador
{
    public long Id { get; set; }
    public long IdOrganizacion { get; set; }
    public string? NumeroCedulaExtranjeria { get; set; }
    public string? NumeroPasaporte { get; set; }
    public string? PrimerNombre { get; set; }
    public string? SegundoNombre { get; set; }
    public string? PrimerApellido { get; set; }
    public string? SegundoApellido { get; set; }
    public string? CodigoGenero { get; set; }
    public string? CodigoEstadoCivil { get; set; }
    public DateTime? FechaNacimiento { get; set; }
    public string? CodigoPaisNacimiento { get; set; }
    public string? CodigoPaisCiudadania { get; set; }
    public long? TipoDeVisa { get; set; }
    public string? TipoDocumento { get; set; }
    public string? UsuarioRegistro { get; set; }
    public DateTime? FechaRegistro { get; set; }
    public bool ContratoHabilitado { get; set; }

    public ICollection<Contrato> Contratos { get; set; } = [];
    public ICollection<ContratoIdioma> Idiomas { get; set; } = [];
    public ICollection<ContratoNivelEducativo> NivelesEducativos { get; set; } = [];
}
