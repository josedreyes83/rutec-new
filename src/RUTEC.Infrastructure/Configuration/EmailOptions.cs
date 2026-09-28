namespace RUTEC.Infrastructure.Configuration;

/// <summary>
/// Seccion "Email" de appsettings. Usuario y clave van solo en
/// appsettings.{Environment}.json, que no se versiona.
/// </summary>
public class EmailOptions
{
    public const string Seccion = "Email";

    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string From { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;
    public string? User { get; set; }
    public string? Password { get; set; }

    /// <summary>
    /// En false no se abre ninguna conexion SMTP, pero el correo igual se
    /// registra en la bitacora como PENDIENTE. Sirve para levantar el
    /// entorno local sin un servidor de correo y sin perder el rastro.
    /// </summary>
    public bool Habilitado { get; set; } = true;

    /// <summary>
    /// StartTls (587, lo normal y el valor por defecto), SslOnConnect (465),
    /// Auto (usa TLS solo si el servidor lo ofrece) o Ninguna (texto plano).
    /// Las dos ultimas existen para relays internos sin TLS; no usarlas
    /// contra un servidor publico ni con credenciales reales.
    /// </summary>
    public string Seguridad { get; set; } = "StartTls";

    /// <summary>
    /// Intentos totales por correo, contando el primero. Al agotarse la fila
    /// queda en FALLIDO y el reintento deja de tomarla.
    /// </summary>
    public int MaxIntentos { get; set; } = 5;

    /// <summary>Cada cuanto barre la bitacora el servicio de reintento.</summary>
    public int IntervaloReintentoSegundos { get; set; } = 300;

    /// <summary>Cuantos correos despacha el reintento por vuelta.</summary>
    public int LoteReintento { get; set; } = 50;

    public int TimeoutSegundos { get; set; } = 30;
}
