using Microsoft.EntityFrameworkCore;

namespace RUTEC.Infrastructure.Data;

public class RueReadOnlyDbContext : DbContext
{
    public RueReadOnlyDbContext(DbContextOptions<RueReadOnlyDbContext> options) : base(options) { }

    public DbSet<OrganizacionEntity> Organizaciones => Set<OrganizacionEntity>();
    public DbSet<OrganizacionRepresentanteEntity> Representantes => Set<OrganizacionRepresentanteEntity>();
    public DbSet<ActividadEconomicaEntity> ActividadesEconomicas => Set<ActividadEconomicaEntity>();
    public DbSet<CodigoReferenciaRueEntity> CodigosReferencia => Set<CodigoReferenciaRueEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<OrganizacionEntity>(e =>
        {
            e.ToTable("ORGANIZACION");
            e.HasKey(x => x.IdOrganizacion);
            e.Property(x => x.IdOrganizacion).HasColumnName("ID_ORGANIZACION");
            e.Property(x => x.CodigoDocId).HasColumnName("CODIGO_DOC_ID").HasMaxLength(10);
            e.Property(x => x.ValorDocId).HasColumnName("VALOR_DOC_ID").HasMaxLength(50);
            e.Property(x => x.DigitoChequeo).HasColumnName("DIGITO_CHEQUEO").HasColumnType("decimal(18,0)");
            e.Property(x => x.NombreCompleto).HasColumnName("NOMBRE_COMPLETO").HasMaxLength(200);
            e.Property(x => x.CodigoActividad).HasColumnName("CODIGO_ACTIVIDAD").HasMaxLength(20);
            e.Property(x => x.Habilitada).HasColumnName("HABILITADA");
            e.Property(x => x.FechaRegistro).HasColumnName("FECHA_REGISTRO");
            e.Property(x => x.CodigoTipoPersona).HasColumnName("CODIGO_TIPO_PERSONA").HasMaxLength(20);
            e.Property(x => x.CodigoRegimenTributario).HasColumnName("CODIGO_REGIMEN_TRIBUTARIO").HasMaxLength(20);
        });

        modelBuilder.Entity<OrganizacionRepresentanteEntity>(e =>
        {
            e.ToTable("ORGANIZACION_REPRESENTANTE");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("ID_REPLEGAL");
            e.Property(x => x.IdOrganizacion).HasColumnName("ID_ORGANIZACION");
            e.Property(x => x.CodigoDocId).HasColumnName("CODIGO_DOC_ID").HasMaxLength(20);
            e.Property(x => x.ValorDocId).HasColumnName("VALOR_DOC_ID").HasMaxLength(50);
            e.Property(x => x.PrimerNombre).HasColumnName("PRIMER_NOMBRE").HasMaxLength(50);
            e.Property(x => x.SegundoNombre).HasColumnName("SEGUNDO_NOMBRE").HasMaxLength(50);
            e.Property(x => x.PrimerApellido).HasColumnName("PRIMER_APELLIDO").HasMaxLength(50);
            e.Property(x => x.SegundoApellido).HasColumnName("SEGUNDO_APELLIDO").HasMaxLength(50);
        });

        modelBuilder.Entity<ActividadEconomicaEntity>(e =>
        {
            e.ToTable("PARAM_ACTIVIDAD_ECONOMICA");
            e.HasNoKey();
            e.Property(x => x.CodigoActividad).HasColumnName("CODIGO_ACTIVIDAD").HasMaxLength(20);
            e.Property(x => x.NombreActividad).HasColumnName("NOMBRE_ACTIVIDAD").HasMaxLength(200);
        });

        modelBuilder.Entity<CodigoReferenciaRueEntity>(e =>
        {
            e.ToTable("CODIGO_REFERENCIA");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("ID_CODREF");
            e.Property(x => x.CodigoReferencia).HasColumnName("CODIGO_REFERENCIA").HasMaxLength(20);
            e.Property(x => x.Descripcion).HasColumnName("DESCRIPCION").HasMaxLength(200);
        });
    }
}

public class OrganizacionEntity
{
    public long IdOrganizacion { get; set; }
    public string? CodigoDocId { get; set; }
    public string? ValorDocId { get; set; }
    public long? DigitoChequeo { get; set; }
    public string? NombreCompleto { get; set; }
    public string? CodigoActividad { get; set; }
    public bool? Habilitada { get; set; }
    public DateTime? FechaRegistro { get; set; }
    public string? CodigoTipoPersona { get; set; }
    public string? CodigoRegimenTributario { get; set; }
}

public class OrganizacionRepresentanteEntity
{
    public long Id { get; set; }
    public long IdOrganizacion { get; set; }
    public string? CodigoDocId { get; set; }
    public string? ValorDocId { get; set; }
    public string? PrimerNombre { get; set; }
    public string? SegundoNombre { get; set; }
    public string? PrimerApellido { get; set; }
    public string? SegundoApellido { get; set; }
}

public class ActividadEconomicaEntity
{
    public string? CodigoActividad { get; set; }
    public string? NombreActividad { get; set; }
}

public class CodigoReferenciaRueEntity
{
    public string Id { get; set; } = "";
    public string? CodigoReferencia { get; set; }
    public string? Descripcion { get; set; }
}
