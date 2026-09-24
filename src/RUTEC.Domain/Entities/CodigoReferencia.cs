namespace RUTEC.Domain.Entities;

public class CodigoReferencia
{
    public long Id { get; set; }
    public string? Codigo { get; set; }
    public string? Nombre { get; set; }
    public string? Grupo { get; set; }
    public string? Dominio { get; set; }
    public short? OrdenPresentacion { get; set; }
}
