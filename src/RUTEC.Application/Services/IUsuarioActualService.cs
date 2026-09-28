namespace RUTEC.Application.Services;

/// <summary>
/// Identidad de quien hace la peticion, ya resuelta contra RUE.
/// </summary>
/// <param name="Usuario">
/// Lo que va a USUARIO_REGISTRO / USUARIO_MODIFICACION. Para una empresa es
/// su NIT, que es lo que RUTEC guarda desde siempre en esas columnas.
/// </param>
/// <param name="IdOrganizacion">
/// La organizacion del usuario, o null si no tiene una: los funcionarios del
/// ministerio (Admin, Verificador) no representan ninguna empresa.
/// </param>
public sealed record UsuarioActual(string Usuario, long? IdOrganizacion);

public interface IUsuarioActualService
{
    /// <summary>
    /// Resuelve la identidad del token. Lanza si no hay usuario autenticado:
    /// todos los endpoints que la usan estan detras de [Authorize], asi que
    /// llegar aqui sin identidad es un error de programacion, no un caso
    /// de negocio.
    /// </summary>
    Task<UsuarioActual> ObtenerAsync(CancellationToken ct = default);
}
