namespace RUTEC.Application.Services;

/// <summary>
/// Un correo por enviar. <paramref name="Destinatario"/> y
/// <paramref name="ConCopia"/> admiten varias direcciones separadas por ';'.
/// </summary>
/// <param name="Plantilla">
/// Nombre logico de la plantilla usada, solo para poder agrupar en la
/// bitacora ("que tanto se esta mandando de constancias"). No se resuelve
/// aqui: el llamador entrega el cuerpo ya armado.
/// </param>
/// <param name="TipoEntidad">TRABAJADOR, CONTRATO o EMPLEADOR.</param>
/// <param name="IdEntidad">Id del registro al que se refiere el correo.</param>
public sealed record MensajeCorreo(
    string Destinatario,
    string Asunto,
    string Cuerpo,
    string? ConCopia = null,
    bool EsHtml = true,
    string? Plantilla = null,
    string? TipoEntidad = null,
    long? IdEntidad = null);

/// <summary>
/// Resultado de un intento de envio. <paramref name="IdLog"/> siempre trae
/// la fila de dbo.TB_LOG_CORREO, incluso cuando el envio fallo: el llamador
/// puede citarla en un mensaje de soporte.
/// </summary>
public sealed record ResultadoCorreo(long IdLog, bool Enviado, string? Error);

public interface IEmailService
{
    /// <summary>
    /// Registra el correo en la bitacora e intenta enviarlo de inmediato.
    /// No lanza si el SMTP falla: deja la fila en FALLIDO para que el
    /// reintento la recoja, porque un correo caido no deberia tumbar la
    /// operacion de negocio que lo disparo.
    /// </summary>
    Task<ResultadoCorreo> EnviarAsync(MensajeCorreo mensaje, CancellationToken ct = default);

    /// <summary>
    /// Registra el correo como PENDIENTE sin intentar enviarlo. Para
    /// volumenes donde esperar al SMTP dentro de la peticion no tiene
    /// sentido; el reintento en segundo plano lo despacha.
    /// </summary>
    Task<long> EncolarAsync(MensajeCorreo mensaje, CancellationToken ct = default);
}
