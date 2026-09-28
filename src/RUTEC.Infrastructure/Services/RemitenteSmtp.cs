using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using MimeKit.Text;
using RUTEC.Infrastructure.Configuration;

namespace RUTEC.Infrastructure.Services;

/// <summary>
/// El acto de hablar con el servidor SMTP, y nada mas. Sin bitacora y sin
/// reintento: los dos caminos que envian (el inmediato y el de segundo
/// plano) comparten esta pieza para que no haya dos formas distintas de
/// armar el mismo mensaje.
/// </summary>
public interface IRemitenteSmtp
{
    bool Habilitado { get; }

    Task EnviarAsync(string destinatario, string? conCopia, string asunto,
                     string cuerpo, bool esHtml, CancellationToken ct = default);
}

public class RemitenteSmtp : IRemitenteSmtp
{
    private readonly EmailOptions _opciones;

    public RemitenteSmtp(IOptions<EmailOptions> opciones)
    {
        _opciones = opciones.Value;
    }

    public bool Habilitado => _opciones.Habilitado && !string.IsNullOrWhiteSpace(_opciones.SmtpHost);

    public async Task EnviarAsync(string destinatario, string? conCopia, string asunto,
                                  string cuerpo, bool esHtml, CancellationToken ct = default)
    {
        if (!Habilitado)
            throw new InvalidOperationException(
                "El envio de correo esta deshabilitado o falta Email:SmtpHost en la configuracion.");

        var mensaje = new MimeMessage();
        mensaje.From.Add(new MailboxAddress(_opciones.FromName, _opciones.From));

        AgregarDirecciones(mensaje.To, destinatario);
        AgregarDirecciones(mensaje.Cc, conCopia);

        if (mensaje.To.Count == 0)
            throw new InvalidOperationException("El correo no tiene destinatarios validos.");

        mensaje.Subject = asunto;
        mensaje.Body = new TextPart(esHtml ? TextFormat.Html : TextFormat.Plain) { Text = cuerpo };

        using var cliente = new SmtpClient
        {
            Timeout = _opciones.TimeoutSegundos * 1000
        };

        await cliente.ConnectAsync(_opciones.SmtpHost, _opciones.SmtpPort, ResolverSeguridad(), ct);

        // Un relay interno sin autenticacion es un escenario valido en la
        // red del Ministerio; solo autenticar si hay credenciales.
        if (!string.IsNullOrWhiteSpace(_opciones.User))
            await cliente.AuthenticateAsync(_opciones.User, _opciones.Password ?? string.Empty, ct);

        await cliente.SendAsync(mensaje, ct);
        await cliente.DisconnectAsync(true, ct);
    }

    /// <summary>
    /// Un valor desconocido no cae a texto plano: se trata como StartTls,
    /// que es lo unico seguro que se puede asumir ante un error de dedo en
    /// la configuracion.
    /// </summary>
    private SecureSocketOptions ResolverSeguridad() =>
        _opciones.Seguridad?.Trim().ToLowerInvariant() switch
        {
            "sslonconnect" => SecureSocketOptions.SslOnConnect,
            "auto" => SecureSocketOptions.StartTlsWhenAvailable,
            "ninguna" or "none" => SecureSocketOptions.None,
            _ => SecureSocketOptions.StartTls
        };

    /// <summary>
    /// Las direcciones vienen en un solo campo separadas por ';' o ','
    /// porque asi las guarda la tabla. Una direccion mal escrita no tumba
    /// el envio completo: se descarta y siguen las demas.
    /// </summary>
    private static void AgregarDirecciones(InternetAddressList lista, string? crudo)
    {
        if (string.IsNullOrWhiteSpace(crudo)) return;

        foreach (var parte in crudo.Split([';', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (MailboxAddress.TryParse(parte, out var direccion))
                lista.Add(direccion);
        }
    }
}
