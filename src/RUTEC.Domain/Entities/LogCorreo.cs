namespace RUTEC.Domain.Entities;

/// <summary>
/// Bitacora de correos. Cada fila es un envio: que se mando, a quien,
/// como termino y cuantas veces se intento. El cuerpo se guarda porque
/// el reintento tiene que poder reenviar despues de un reinicio.
/// </summary>
public class LogCorreo
{
    public long Id { get; set; }

    public string Destinatario { get; set; } = string.Empty;
    public string? ConCopia { get; set; }
    public string Asunto { get; set; } = string.Empty;
    public string? Cuerpo { get; set; }
    public bool? EsHtml { get; set; }
    public string? Plantilla { get; set; }

    public string? TipoEntidad { get; set; }
    public long? IdEntidad { get; set; }

    public string Estado { get; set; } = EstadoCorreo.Pendiente;
    public int Intentos { get; set; }
    public string? ErrorMensaje { get; set; }

    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaUltimoIntento { get; set; }
    public DateTime? FechaEnvio { get; set; }

    public string? UsuarioOrigen { get; set; }
}

/// <summary>
/// Los tres valores que admite el CHECK de dbo.TB_LOG_CORREO.
/// </summary>
public static class EstadoCorreo
{
    public const string Pendiente = "PENDIENTE";
    public const string Enviado = "ENVIADO";
    public const string Fallido = "FALLIDO";
}
