using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RUTEC.Application.Services;
using RUTEC.Domain.Entities;
using RUTEC.Infrastructure.Configuration;
using RUTEC.Infrastructure.Data;

namespace RUTEC.Infrastructure.Services;

public class EmailServiceImpl : IEmailService
{
    private readonly RutecDbContext _db;
    private readonly IRemitenteSmtp _remitente;
    private readonly EmailOptions _opciones;
    private readonly ILogger<EmailServiceImpl> _log;
    private readonly IUsuarioActualService _usuarioActual;

    public EmailServiceImpl(
        RutecDbContext db,
        IRemitenteSmtp remitente,
        IOptions<EmailOptions> opciones,
        ILogger<EmailServiceImpl> log,
        IUsuarioActualService usuarioActual)
    {
        _db = db;
        _remitente = remitente;
        _opciones = opciones.Value;
        _log = log;
        _usuarioActual = usuarioActual;
    }

    public async Task<ResultadoCorreo> EnviarAsync(MensajeCorreo mensaje, CancellationToken ct = default)
    {
        var log = await RegistrarAsync(mensaje, ct);

        // Sin SMTP configurado la fila queda PENDIENTE, no FALLIDA: no se
        // gasta un intento por algo que no es culpa del correo.
        if (!_remitente.Habilitado)
        {
            _log.LogWarning("Correo {IdLog} queda pendiente: el envio SMTP esta deshabilitado.", log.Id);
            return new ResultadoCorreo(log.Id, false, "Envio SMTP deshabilitado.");
        }

        var (enviado, error) = await IntentarAsync(log, ct);
        return new ResultadoCorreo(log.Id, enviado, error);
    }

    public async Task<long> EncolarAsync(MensajeCorreo mensaje, CancellationToken ct = default)
    {
        var log = await RegistrarAsync(mensaje, ct);
        return log.Id;
    }

    /// <summary>
    /// Deja la fila en la bitacora antes de tocar el SMTP. Si el proceso se
    /// cae en el envio, el correo sigue existiendo y el reintento lo toma.
    /// </summary>
    private async Task<LogCorreo> RegistrarAsync(MensajeCorreo mensaje, CancellationToken ct)
    {
        var log = new LogCorreo
        {
            Destinatario = Recortar(mensaje.Destinatario, 500)!,
            ConCopia = Recortar(mensaje.ConCopia, 500),
            Asunto = Recortar(mensaje.Asunto, 500)!,
            Cuerpo = mensaje.Cuerpo,
            EsHtml = mensaje.EsHtml,
            Plantilla = Recortar(mensaje.Plantilla, 100),
            TipoEntidad = Recortar(mensaje.TipoEntidad, 50),
            IdEntidad = mensaje.IdEntidad,
            Estado = EstadoCorreo.Pendiente,
            Intentos = 0,
            FechaCreacion = DateTime.Now,
            UsuarioOrigen = await ResolverUsuarioAsync(ct)
        };

        _db.LogCorreos.Add(log);
        await _db.SaveChangesAsync(ct);
        return log;
    }

    /// <summary>
    /// Un intento de envio sobre una fila ya registrada. Comparte forma con
    /// el reintento en segundo plano (ver ReintentoCorreoService).
    /// </summary>
    internal async Task<(bool Enviado, string? Error)> IntentarAsync(LogCorreo log, CancellationToken ct)
    {
        log.Intentos++;
        log.FechaUltimoIntento = DateTime.Now;

        try
        {
            await _remitente.EnviarAsync(
                log.Destinatario, log.ConCopia, log.Asunto,
                log.Cuerpo ?? string.Empty, log.EsHtml ?? true, ct);

            log.Estado = EstadoCorreo.Enviado;
            log.FechaEnvio = DateTime.Now;
            log.ErrorMensaje = null;
            await _db.SaveChangesAsync(ct);

            _log.LogInformation("Correo {IdLog} enviado a {Destinatario}.", log.Id, log.Destinatario);
            return (true, null);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // El correo no puede tumbar la operacion de negocio que lo
            // disparo: se deja constancia y se devuelve el error al llamador.
            var error = Sanear(ex.Message);

            log.Estado = EstadoCorreo.Fallido;
            log.ErrorMensaje = Recortar(error, 2000);
            await _db.SaveChangesAsync(ct);

            _log.LogError(ex, "Fallo el envio del correo {IdLog} a {Destinatario} (intento {Intento} de {Max}).",
                log.Id, log.Destinatario, log.Intentos, _opciones.MaxIntentos);
            return (false, error);
        }
    }

    private async Task<string?> ResolverUsuarioAsync(CancellationToken ct)
    {
        try
        {
            return (await _usuarioActual.ObtenerAsync(ct)).Usuario;
        }
        catch (InvalidOperationException)
        {
            // Fuera de una peticion HTTP no hay usuario. Es el caso normal
            // en trabajos de fondo, no un error.
            return null;
        }
    }

    /// <summary>
    /// El mensaje de error va a una tabla que consulta soporte y a los logs
    /// de Serilog. MailKit devuelve la respuesta cruda del servidor en los
    /// fallos de autenticacion, y ahi puede venir el usuario o la clave.
    /// </summary>
    private string Sanear(string mensaje)
    {
        var limpio = mensaje;

        foreach (var secreto in new[] { _opciones.Password, _opciones.User })
        {
            if (!string.IsNullOrWhiteSpace(secreto))
                limpio = limpio.Replace(secreto, "***", StringComparison.OrdinalIgnoreCase);
        }

        return limpio;
    }

    private static string? Recortar(string? texto, int max) =>
        texto == null || texto.Length <= max ? texto : texto[..max];
}
