using RUTEC.Domain.Entities;

namespace RUTEC.Infrastructure.Services;

/// <summary>
/// Traduce a texto los valores que apuntan a CODIGO_REFERENCIA.
/// </summary>
/// <remarks>
/// La base guarda la referencia de dos formas distintas segun la columna:
///   - ID_COD_REFERENCIA_NUM (la PK): CODIGO_GENERO, CODIGO_ESTADO_CIVIL,
///     TIPO_DE_VISA, TIPO_CONTRATO_TRABAJADOR, CODIGO_IDIOMA,
///     CODIGO_NIVEL_*, CODIGO_NIVEL_EDUCATIVO.
///   - CODIGO_VALOR (el codigo corto): TIPO_DOCUMENTO.
/// Por eso se intenta primero por id y despues por codigo, en vez de asumir
/// una sola convencion.
/// </remarks>
public sealed class CodigoReferenciaResolver
{
    private readonly IReadOnlyList<CodigoReferencia> _codigos;

    public CodigoReferenciaResolver(IReadOnlyList<CodigoReferencia> codigos)
    {
        _codigos = codigos;
    }

    /// <summary>
    /// Devuelve la descripcion del valor dentro del grupo, o <paramref name="valor"/>
    /// sin traducir si no existe en el catalogo.
    /// </summary>
    public string? Describir(string? valor, string grupo)
    {
        if (string.IsNullOrWhiteSpace(valor)) return null;
        return Buscar(valor, grupo)?.Nombre ?? valor;
    }

    /// <inheritdoc cref="Describir(string?, string)"/>
    public string? Describir(long? valor, string grupo) =>
        valor.HasValue ? Describir(valor.Value.ToString(), grupo) : null;

    /// <summary>
    /// Igual que <see cref="Describir(string?, string)"/> pero devuelve
    /// "Sin especificar" cuando el valor viene vacio. Para reportes y graficas,
    /// donde una etiqueta nula rompe la presentacion.
    /// </summary>
    public string Etiquetar(string? valor, string grupo) =>
        string.IsNullOrWhiteSpace(valor) ? "Sin especificar" : Describir(valor, grupo)!;

    /// <inheritdoc cref="Etiquetar(string?, string)"/>
    public string Etiquetar(long? valor, string grupo) =>
        valor.HasValue ? Etiquetar(valor.Value.ToString(), grupo) : "Sin especificar";

    private CodigoReferencia? Buscar(string valor, string grupo)
    {
        if (long.TryParse(valor, out var id))
        {
            var porId = _codigos.FirstOrDefault(c => c.Id == id && c.Grupo == grupo);
            if (porId != null) return porId;
        }
        return _codigos.FirstOrDefault(c => c.Codigo == valor && c.Grupo == grupo);
    }
}
