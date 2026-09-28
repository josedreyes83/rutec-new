using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RUTEC.Domain.Entities;
using RUTEC.Infrastructure.Configuration;
using RUTEC.Infrastructure.Data;

namespace RUTEC.Infrastructure.Services;

/// <summary>
/// Barre la bitacora cada cierto tiempo y reintenta lo que no ha salido.
/// Toma PENDIENTE (encolados, o registrados mientras el SMTP estaba caido)
/// y FALLIDO que aun tengan intentos disponibles.
/// </summary>
public class ReintentoCorreoService : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly EmailOptions _opciones;
    private readonly ILogger<ReintentoCorreoService> _log;

    public ReintentoCorreoService(
        IServiceScopeFactory scopes,
        IOptions<EmailOptions> opciones,
        ILogger<ReintentoCorreoService> log)
    {
        _scopes = scopes;
        _opciones = opciones.Value;
        _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        if (!_opciones.Habilitado)
        {
            _log.LogInformation("Reintento de correos inactivo: Email:Habilitado esta en false.");
            return;
        }

        var intervalo = TimeSpan.FromSeconds(Math.Max(30, _opciones.IntervaloReintentoSegundos));
        using var reloj = new PeriodicTimer(intervalo);

        _log.LogInformation("Reintento de correos activo cada {Segundos}s, hasta {Max} intentos por correo.",
            intervalo.TotalSeconds, _opciones.MaxIntentos);

        while (await EsperarAsync(reloj, ct))
        {
            try
            {
                await ProcesarLoteAsync(ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Una vuelta mala no puede matar el servicio: se reintenta
                // en el siguiente ciclo.
                _log.LogError(ex, "Fallo una vuelta del reintento de correos.");
            }
        }
    }

    private static async Task<bool> EsperarAsync(PeriodicTimer reloj, CancellationToken ct)
    {
        try
        {
            return await reloj.WaitForNextTickAsync(ct);
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }

    private async Task ProcesarLoteAsync(CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<RutecDbContext>();
        // El tipo concreto, no la interfaz: reintentar es operar sobre filas
        // que ya existen, y eso no es parte del contrato de IEmailService.
        // Comparten el DbContext del scope, asi que las entidades que se
        // cargan aqui son las mismas que IntentarAsync guarda.
        var servicio = scope.ServiceProvider.GetRequiredService<EmailServiceImpl>();

        var pendientes = await db.LogCorreos
            .Where(c => c.Estado != EstadoCorreo.Enviado
                        && c.Intentos < _opciones.MaxIntentos
                        // Las filas anteriores a db/migrations/002 no tienen
                        // cuerpo guardado: no hay nada que reenviar.
                        && c.Cuerpo != null)
            .OrderBy(c => c.FechaCreacion)
            .Take(Math.Max(1, _opciones.LoteReintento))
            .ToListAsync(ct);

        if (pendientes.Count == 0) return;

        _log.LogInformation("Reintentando {Cantidad} correos.", pendientes.Count);

        var enviados = 0;
        foreach (var correo in pendientes)
        {
            if (ct.IsCancellationRequested) break;

            var (ok, _) = await servicio.IntentarAsync(correo, ct);
            if (ok) enviados++;
        }

        _log.LogInformation("Reintento terminado: {Enviados} de {Total} salieron.", enviados, pendientes.Count);
    }
}
