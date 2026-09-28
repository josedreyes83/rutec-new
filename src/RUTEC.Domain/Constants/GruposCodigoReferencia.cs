namespace RUTEC.Domain.Constants;

/// <summary>
/// Nombres de los grupos de la tabla CODIGO_REFERENCIA.
/// Son los 21 valores reales de la columna GRUPO. Usar estas constantes en vez
/// de literales: varios grupos estaban mal escritos en el codigo y las
/// busquedas devolvian vacio sin error.
/// </summary>
public static class GruposCodigoReferencia
{
    public const string Aclaracion = "ACLARACION";
    public const string CalificacionIdioma = "CODCALIFICACIONIDIOMA";
    public const string EstadoSolicitud = "CODESTADOSOLICITUD";
    public const string EstadoVerificacion = "CODESTADOVERIFICACION";
    public const string Genero = "CODGENERO";
    public const string TipoIdEmpresa = "CODIGOTIPOIDEMPRESA";
    public const string NivelEducativo = "CODNIVELEDUCATIVO";
    public const string Resolucion = "CODRESOLUCION";
    public const string Sexo = "CODSEXO";
    public const string TipoContrato = "CODTIPOCONTRATO";
    public const string TipoDocumento = "CODTIPODOCUMENTO";
    public const string TipoIdioma = "CODTIPOIDIOMA";
    public const string TipoIdRepLegal = "CODTIPOIDREPLEG";
    public const string TipoRechazo = "CODTIPORECHAZO";
    public const string TipoSeguridadSocial = "CODTIPOSEGURIDADSOCIAL";
    public const string HabilidadIdioma = "HABILIDADIDIOMAPERSONA";
    public const string TipoElimina = "TIPOELIMINA";
    public const string TipoEmpleador = "TIPOEMPLEADOR";
    public const string EstadoCivil = "TIPOESTADOCIVIL";
    public const string TipoNovedadContrato = "TIPONOVEDADCONTRATO";
    public const string TipoVisa = "TIPOVISA";
}
