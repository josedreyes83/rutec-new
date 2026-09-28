using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using RUTEC.Application.Services;
using RUTEC.Infrastructure.Data;

namespace RUTEC.WebApi.Services;

/// <summary>
/// Resuelve quien hace la peticion a partir del JWT.
/// </summary>
/// <remarks>
/// El token trae NameIdentifier (el GUID de Identity), Email, Name y los
/// roles. No trae la organizacion, asi que hay que buscarla.
///
/// El puente es el nombre de usuario: en AS_DB_RUE una empresa se registra
/// con su NIT como UserName, y ese NIT es VALOR_DOC_ID en RUE.ORGANIZACION.
/// El NIT es unico por organizacion (32.819 NITs distintos sobre 32.819
/// filas), asi que la busqueda es determinista.
///
/// Esa misma cadena explica por que Usuario es el NIT y no el correo ni el
/// GUID: USUARIO_REGISTRO ya guarda el NIT en los contratos que hay en
/// produccion. Escribir otra cosa partiria la columna en dos formatos y
/// dejaria sin sentido los reportes que agrupan por ella.
///
/// Los usuarios del ministerio no son empresas: su UserName no es un NIT
/// (hay varios tipo 'jvargasp') y no resuelve a ninguna organizacion. Para
/// ellos IdOrganizacion queda null y Usuario es el UserName tal cual.
///
/// Vive en WebApi y no en Infrastructure a proposito: leer el HttpContext es
/// un asunto de la capa web.
/// </remarks>
public class UsuarioActualService : IUsuarioActualService
{
    private readonly IHttpContextAccessor _http;
    private readonly RueReadOnlyDbContext _rue;

    // Scoped: una misma peticion puede pedir la identidad varias veces y no
    // tiene sentido ir a RUE cada vez.
    private UsuarioActual? _cache;

    public UsuarioActualService(IHttpContextAccessor http, RueReadOnlyDbContext rue)
    {
        _http = http;
        _rue = rue;
    }

    public async Task<UsuarioActual> ObtenerAsync(CancellationToken ct = default)
    {
        if (_cache != null) return _cache;

        var nombreUsuario = _http.HttpContext?.User?.FindFirstValue(ClaimTypes.Name);

        if (string.IsNullOrWhiteSpace(nombreUsuario))
            throw new InvalidOperationException(
                "No hay usuario autenticado en la peticion. El endpoint debe estar bajo [Authorize].");

        nombreUsuario = nombreUsuario.Trim();

        // Solo tiene sentido buscar organizacion si el UserName parece un NIT.
        long? idOrganizacion = null;
        if (nombreUsuario.Length > 0 && nombreUsuario.All(char.IsDigit))
        {
            idOrganizacion = await _rue.Organizaciones
                .Where(o => o.ValorDocId == nombreUsuario)
                .Select(o => (long?)o.IdOrganizacion)
                .FirstOrDefaultAsync(ct);
        }

        _cache = new UsuarioActual(nombreUsuario, idOrganizacion);
        return _cache;
    }
}
