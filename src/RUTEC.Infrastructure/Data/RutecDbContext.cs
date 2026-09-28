using Microsoft.EntityFrameworkCore;
using RUTEC.Domain.Entities;

namespace RUTEC.Infrastructure.Data;

public class RutecDbContext : DbContext
{
    public RutecDbContext(DbContextOptions<RutecDbContext> options) : base(options) { }

    // RUTEC business tables
    public DbSet<MigranteTrabajador> MigrantesTrabajadores => Set<MigranteTrabajador>();
    public DbSet<Contrato> Contratos => Set<Contrato>();
    public DbSet<ContratoIdioma> ContratosIdiomas => Set<ContratoIdioma>();
    public DbSet<ContratoNivelEducativo> ContratosNivelesEducativos => Set<ContratoNivelEducativo>();
    public DbSet<VerificacionContrato> VerificacionesContratos => Set<VerificacionContrato>();
    public DbSet<EntidadSeguridadSocial> EntidadesSeguridadSocial => Set<EntidadSeguridadSocial>();
    public DbSet<OcupacionLaboral> OcupacionesLaborales => Set<OcupacionLaboral>();

    // Parametric tables (RUTEC DB)
    public DbSet<CodigoReferencia> CodigosReferencia => Set<CodigoReferencia>();
    public DbSet<Pais> Paises => Set<Pais>();
    public DbSet<Departamento> Departamentos => Set<Departamento>();
    public DbSet<Municipio> Municipios => Set<Municipio>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SQL Server numeric -> C# long: need explicit conversion
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(long) || property.ClrType == typeof(long?))
                {
                    property.SetColumnType("decimal(18,0)");
                }
            }
        }

        // TB_MIGRANTE_TRABAJADOR
        modelBuilder.Entity<MigranteTrabajador>(entity =>
        {
            // La tabla tiene un trigger de auditoria. Sin declararlo, EF Core
            // genera INSERT ... OUTPUT sin INTO y SQL Server lo rechaza (Msg 334).
            entity.ToTable("TB_MIGRANTE_TRABAJADOR",
                tb => tb.HasTrigger("Insertar_Log_migrante_trabajador"));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID_MIGRANTE_TRABAJADOR");
            entity.Property(e => e.IdOrganizacion).HasColumnName("ID_ORGANIZACION");
            entity.Property(e => e.NumeroCedulaExtranjeria).HasColumnName("NUMERO_CEDULA_EXTRANJERIA").HasMaxLength(15);
            entity.Property(e => e.NumeroPasaporte).HasColumnName("NUMERO_PASAPORTE").HasMaxLength(20);
            entity.Property(e => e.PrimerNombre).HasColumnName("PRIMER_NOMBRE").HasMaxLength(50);
            entity.Property(e => e.SegundoNombre).HasColumnName("SEGUNDO_NOMBRE").HasMaxLength(50);
            entity.Property(e => e.PrimerApellido).HasColumnName("PRIMER_APELLIDO").HasMaxLength(50);
            entity.Property(e => e.SegundoApellido).HasColumnName("SEGUNDO_APELLIDO").HasMaxLength(50);
            entity.Property(e => e.CodigoGenero).HasColumnName("CODIGO_GENERO").HasMaxLength(10);
            entity.Property(e => e.CodigoEstadoCivil).HasColumnName("CODIGO_ESTADO_CIVIL").HasMaxLength(10);
            entity.Property(e => e.FechaNacimiento).HasColumnName("FECHA_NACIMIENTO");
            entity.Property(e => e.CodigoPaisNacimiento).HasColumnName("CODIGO_PAIS_NACIMIENTO").HasMaxLength(10);
            entity.Property(e => e.CodigoPaisCiudadania).HasColumnName("CODIGO_PAIS_CIUDADANIA").HasMaxLength(10);
            entity.Property(e => e.TipoDeVisa).HasColumnName("TIPO_DE_VISA");
            entity.Property(e => e.TipoDocumento).HasColumnName("TIPO_DOCUMENTO").HasMaxLength(10);
            entity.Property(e => e.UsuarioRegistro).HasColumnName("USUARIO_REGISTRO").HasMaxLength(50);
            entity.Property(e => e.FechaRegistro).HasColumnName("FECHA_REGISTRO");
            entity.Property(e => e.ContratoHabilitado).HasColumnName("CONTRATO_HABILITADO");

            entity.HasMany(e => e.Contratos).WithOne(c => c.MigranteTrabajador)
                .HasForeignKey(c => c.IdMigranteTrabajador);
            entity.HasMany(e => e.Idiomas).WithOne(i => i.MigranteTrabajador)
                .HasForeignKey(i => i.IdTrabajadorMigrante);
            entity.HasMany(e => e.NivelesEducativos).WithOne(n => n.MigranteTrabajador)
                .HasForeignKey(n => n.IdTrabajadorMigrante);
        });

        // TB_MIGRANTE_TRABAJADOR_CONTRATO
        modelBuilder.Entity<Contrato>(entity =>
        {
            entity.ToTable("TB_MIGRANTE_TRABAJADOR_CONTRATO",
                tb => tb.HasTrigger("Insertar_Log_migrante_trabajador_contrato"));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID_MIGRANTE_TRABAJADOR_CONTRATO");
            entity.Property(e => e.IdMigranteTrabajador).HasColumnName("ID_MIGRANTE_TRABAJADOR");
            entity.Property(e => e.IdOrganizacion).HasColumnName("ID_ORGANIZACION");
            entity.Property(e => e.DenominacionContrato).HasColumnName("DENOMINACION_CONTRATO").HasMaxLength(50);
            entity.Property(e => e.TipoContratoTrabajador).HasColumnName("TIPO_CONTRATO_TRABAJADOR").HasMaxLength(10);
            entity.Property(e => e.CargoTrabajador).HasColumnName("CARGO_TRABAJADOR").HasMaxLength(120);
            entity.Property(e => e.VigenciaDesde).HasColumnName("VIGENCIA_DESDE");
            entity.Property(e => e.VigenciaHasta).HasColumnName("VIGENCIA_HASTA");
            entity.Property(e => e.CodigoOcupacionLaboral1).HasColumnName("CODIGO_OCUPACION_LABORAL_1").HasMaxLength(20);
            entity.Property(e => e.CodigoOcupacionLaboral2).HasColumnName("CODIGO_OCUPACION_LABORAL_2").HasMaxLength(20);
            entity.Property(e => e.CodigoOcupacionLaboral3).HasColumnName("CODIGO_OCUPACION_LABORAL_3").HasMaxLength(20);
            entity.Property(e => e.CodigoDepto).HasColumnName("CODIGO_DEPTO").HasMaxLength(10);
            entity.Property(e => e.CodigoMpio).HasColumnName("CODIGO_MPIO").HasMaxLength(10);
            entity.Property(e => e.Profesion).HasColumnName("PROFESION").HasMaxLength(120);
            entity.Property(e => e.TarjetaProfesional).HasColumnName("TARJETA_PROFESIONAL").HasMaxLength(120);
            entity.Property(e => e.DescripcionContrato).HasColumnName("DESCRIPCION_CONTRATO").HasMaxLength(512);
            entity.Property(e => e.CodigoEntidadPension).HasColumnName("CODIGO_ENTIDAD_PENSION").HasMaxLength(20);
            entity.Property(e => e.CodigoEntidadSalud).HasColumnName("CODIGO_ENTIDAD_SALUD").HasMaxLength(20);
            entity.Property(e => e.CodigoEntidadRiesgos).HasColumnName("CODIGO_ENTIDAD_RIESGOS").HasMaxLength(20);
            entity.Property(e => e.CodigoEntidadCaja).HasColumnName("CODIGO_ENTIDAD_CAJA").HasMaxLength(20);
            entity.Property(e => e.FechaRegistro).HasColumnName("FECHA_REGISTRO");
            entity.Property(e => e.UsuarioRegistro).HasColumnName("USUARIO_REGISTRO").HasMaxLength(50);
            entity.Property(e => e.FechaModificacion).HasColumnName("FECHA_MODIFICACION");
            entity.Property(e => e.UsuarioModificacion).HasColumnName("USUARIO_MODIFICACION").HasMaxLength(50);
            entity.Property(e => e.Eliminado).HasColumnName("ELIMINADO");
            entity.Property(e => e.MotivoEliminado).HasColumnName("MOTIVO_ELIMINADO").HasMaxLength(500);

            entity.HasMany(e => e.Verificaciones).WithOne(v => v.Contrato)
                .HasForeignKey(v => v.IdMigranteContratoTrabajador);
        });

        // CONTRATO_MIGRANTE_IDIOMA
        modelBuilder.Entity<ContratoIdioma>(entity =>
        {
            entity.ToTable("CONTRATO_MIGRANTE_IDIOMA",
                tb => tb.HasTrigger("Insertar_Log_contrato_migrante_idioma"));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID_MIGRANTE_IDIOMA");
            entity.Property(e => e.IdTrabajadorMigrante).HasColumnName("ID_TRABAJADOR_MIGRANTE");
            entity.Property(e => e.CodigoIdioma).HasColumnName("CODIGO_IDIOMA");
            entity.Property(e => e.CodigoNivelHablado).HasColumnName("CODIGO_NIVEL_HABLADO");
            entity.Property(e => e.CodigoNivelEscrito).HasColumnName("CODIGO_NIVEL_ESCRITO");
            entity.Property(e => e.CodigoNivelLeido).HasColumnName("CODIGO_NIVEL_LEIDO");
            entity.Property(e => e.FechaRegistro).HasColumnName("FECHA_REGISTRO");
            entity.Property(e => e.UsuarioRegistro).HasColumnName("USUARIO_REGISTRO").HasMaxLength(50);
        });

        // CONTRATO_MIGRANTE_NIVEL_EDUCATIVO
        modelBuilder.Entity<ContratoNivelEducativo>(entity =>
        {
            entity.ToTable("CONTRATO_MIGRANTE_NIVEL_EDUCATIVO",
                tb => tb.HasTrigger("Insertar_Log_contrato_migrante_nivel_educativo"));
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID_ESTUDIO_MIGRANTE");
            entity.Property(e => e.IdTrabajadorMigrante).HasColumnName("ID_TRABAJADOR_MIGRANTE");
            entity.Property(e => e.CodigoNivelEducativo).HasColumnName("CODIGO_NIVEL_EDUCATIVO");
            entity.Property(e => e.SemestresCursados).HasColumnName("SEMESTRES_CURSADOS");
            entity.Property(e => e.ObtuvoTituloEducativo).HasColumnName("OBTUVO_TITULO_EDUCATIVO").HasMaxLength(10);
            entity.Property(e => e.TituloNivelEducativo).HasColumnName("TITULO_NIVEL_EDUCATIVO").HasMaxLength(200);
            entity.Property(e => e.FechaRegistro).HasColumnName("FECHA_REGISTRO");
            entity.Property(e => e.UsuarioRegistro).HasColumnName("USUARIO_REGISTRO").HasMaxLength(50);
        });

        // TB_VERIFICACION_CONTRATO
        modelBuilder.Entity<VerificacionContrato>(entity =>
        {
            entity.ToTable("TB_VERIFICACION_CONTRATO");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID_VERIFICACION_CONTRATO");
            entity.Property(e => e.IdMigranteContratoTrabajador).HasColumnName("ID_MIGRANTE_TRABAJADOR_CONTRATO");
            entity.Property(e => e.Aclaracion).HasColumnName("ACLARACION").HasMaxLength(10);
            entity.Property(e => e.MotivoAclaracion).HasColumnName("MOTIVO_ACLARACION").HasMaxLength(500);
            entity.Property(e => e.Observacion).HasColumnName("OBSERVACION").HasMaxLength(500);
            entity.Property(e => e.UsuarioRegistro).HasColumnName("USUARIO_REGISTRO").HasMaxLength(50);
            entity.Property(e => e.FechaRegistro).HasColumnName("FECHA_REGISTRO");
        });

        // ENTIDAD_SEGURIDAD_SOCIAL
        modelBuilder.Entity<EntidadSeguridadSocial>(entity =>
        {
            entity.ToTable("ENTIDAD_SEGURIDAD_SOCIAL");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID_ENTIDAD");
            entity.Property(e => e.CodigoEntidad).HasColumnName("CODIGO_ENTIDAD").HasMaxLength(50);
            entity.Property(e => e.CodigoTipoIdEntidad).HasColumnName("CODIGO_TIPO_ID_ENTIDAD").HasMaxLength(50);
            entity.Property(e => e.CodigoTipoSeguridadSocial).HasColumnName("CODIGO_TIPO_SEGURIDAD_SOCIAL").HasMaxLength(50);
            entity.Property(e => e.RazonSocial).HasColumnName("RAZON_SOCIAL").HasMaxLength(200);
            entity.Property(e => e.Nit).HasColumnName("nit").HasMaxLength(50);
        });

        // OCUPACION_LABORAL
        modelBuilder.Entity<OcupacionLaboral>(entity =>
        {
            entity.ToTable("OCUPACION_LABORAL");
            entity.HasNoKey();
            entity.Property(e => e.CodigoOcupacionLaboral).HasColumnName("CODIGO_OCUPACION_LABORAL").HasMaxLength(20);
            entity.Property(e => e.NombreOcupacionLaboral).HasColumnName("NOMBRE_OCUPACION_LABORAL").HasMaxLength(200);
            entity.Property(e => e.CodigoOcupacionLaboralPadre).HasColumnName("CODIGO_OCUPACION_LABORAL_PADRE").HasMaxLength(20);
            entity.Property(e => e.NivelOcupacionLaboral).HasColumnName("NIVEL_OCUPACION_LABORAL");
        });

        // CODIGO_REFERENCIA
        modelBuilder.Entity<CodigoReferencia>(entity =>
        {
            entity.ToTable("CODIGO_REFERENCIA");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ID_COD_REFERENCIA_NUM");
            entity.Property(e => e.Codigo).HasColumnName("CODIGO_VALOR").HasMaxLength(20);
            entity.Property(e => e.Nombre).HasColumnName("DESCRIPCION_VALOR").HasMaxLength(200);
            entity.Property(e => e.Grupo).HasColumnName("GRUPO").HasMaxLength(50);
            entity.Property(e => e.Dominio).HasColumnName("DOMINIO").HasMaxLength(50);
            entity.Property(e => e.OrdenPresentacion).HasColumnName("ORDEN_PRESENTACION");
        });

        // PAIS
        modelBuilder.Entity<Pais>(entity =>
        {
            entity.ToTable("PAIS");
            entity.HasNoKey();
            entity.Property(e => e.Codigo).HasColumnName("GRUPOCODIGOPAIS").HasMaxLength(10);
            entity.Property(e => e.Nombre).HasColumnName("NOMBREPAIS").HasMaxLength(100);
        });

        // PARAM_DEPARTAMENTO
        modelBuilder.Entity<Departamento>(entity =>
        {
            entity.ToTable("DEPARTAMENTO");
            entity.HasNoKey();
            entity.Property(e => e.Codigo).HasColumnName("CODDEPARTAMENTO").HasMaxLength(10);
            entity.Property(e => e.Nombre).HasColumnName("NOMDEPARTAMENTOCONSULTA").HasMaxLength(100);
        });

        // PARAM_MUNICIPIO
        modelBuilder.Entity<Municipio>(entity =>
        {
            entity.ToTable("MUNICIPIO");
            entity.HasNoKey();
            entity.Property(e => e.Codigo).HasColumnName("CODMUNICIPIO").HasMaxLength(10);
            entity.Property(e => e.Nombre).HasColumnName("NOMMUNICIPIONACIONAL").HasMaxLength(100);
            entity.Property(e => e.DepartamentoId).HasColumnName("CODDEPARTAMENTO");
        });
    }
}
