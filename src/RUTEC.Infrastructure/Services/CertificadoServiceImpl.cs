using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;
using RUTEC.Domain.Constants;
using RUTEC.Infrastructure.Data;

namespace RUTEC.Infrastructure.Services;

public class CertificadoServiceImpl : ICertificadoService
{
    private static readonly HashSet<string> PaisesComunidadAndina = ["218", "604", "068"];

    private readonly RutecDbContext _db;

    public CertificadoServiceImpl(RutecDbContext db)
    {
        _db = db;
    }

    public async Task<List<CertificadoInfoDto>> GetByTrabajadorAsync(long trabajadorId)
    {
        var trabajador = await _db.MigrantesTrabajadores
            .FirstOrDefaultAsync(t => t.Id == trabajadorId);

        if (trabajador == null) return [];

        var paises = await _db.Paises.ToListAsync();
        var refs = new CodigoReferenciaResolver(await _db.CodigosReferencia.ToListAsync());

        var paisNacimiento = paises.FirstOrDefault(p => p.Codigo == trabajador.CodigoPaisNacimiento);
        var esCAN = PaisesComunidadAndina.Contains(trabajador.CodigoPaisNacimiento ?? "");

        var nombreCompleto = BuildNombreCompleto(
            trabajador.PrimerNombre, trabajador.SegundoNombre,
            trabajador.PrimerApellido, trabajador.SegundoApellido);

        var contratos = await _db.Contratos
            .Where(c => c.IdMigranteTrabajador == trabajadorId && !c.Eliminado)
            .OrderByDescending(c => c.FechaRegistro)
            .ToListAsync();

        // Get organization names via raw SQL (TB_ORGANIZACION may not be mapped as entity)
        var orgIds = contratos.Select(c => c.IdOrganizacion).Where(id => id.HasValue).Distinct().ToList();
        var orgNames = new Dictionary<long, string>();
        if (orgIds.Count > 0)
        {
            orgNames = await GetOrganizacionNombresAsync(orgIds);
        }

        return contratos.Select(c =>
        {
            var tipoContratoDesc = refs.Describir(c.TipoContratoTrabajador, GruposCodigoReferencia.TipoContrato);

            string? orgName = null;
            if (c.IdOrganizacion.HasValue)
                orgNames.TryGetValue(c.IdOrganizacion.Value, out orgName);

            return new CertificadoInfoDto(
                c.Id, trabajadorId,
                nombreCompleto, trabajador.NumeroCedulaExtranjeria,
                paisNacimiento?.Nombre, trabajador.CodigoPaisNacimiento,
                c.DenominacionContrato, c.CargoTrabajador,
                tipoContratoDesc, c.VigenciaDesde, c.VigenciaHasta,
                orgName, esCAN
            );
        }).ToList();
    }

    public async Task<CertificadoInfoDto?> GetInfoContratoAsync(long contratoId)
    {
        var contrato = await _db.Contratos
            .Include(c => c.MigranteTrabajador)
            .FirstOrDefaultAsync(c => c.Id == contratoId);

        if (contrato?.MigranteTrabajador == null) return null;

        var t = contrato.MigranteTrabajador;
        var paises = await _db.Paises.ToListAsync();
        var refs = new CodigoReferenciaResolver(await _db.CodigosReferencia.ToListAsync());

        var paisNacimiento = paises.FirstOrDefault(p => p.Codigo == t.CodigoPaisNacimiento);
        var esCAN = PaisesComunidadAndina.Contains(t.CodigoPaisNacimiento ?? "");
        var tipoContratoDesc = refs.Describir(contrato.TipoContratoTrabajador, GruposCodigoReferencia.TipoContrato);

        string? orgName = null;
        if (contrato.IdOrganizacion.HasValue)
        {
            var orgNames = await GetOrganizacionNombresAsync([contrato.IdOrganizacion]);
            orgNames.TryGetValue(contrato.IdOrganizacion.Value, out orgName);
        }

        return new CertificadoInfoDto(
            contrato.Id, t.Id,
            BuildNombreCompleto(t.PrimerNombre, t.SegundoNombre, t.PrimerApellido, t.SegundoApellido),
            t.NumeroCedulaExtranjeria,
            paisNacimiento?.Nombre, t.CodigoPaisNacimiento,
            contrato.DenominacionContrato, contrato.CargoTrabajador,
            tipoContratoDesc, contrato.VigenciaDesde, contrato.VigenciaHasta,
            orgName, esCAN
        );
    }

    public async Task<GenerarCertificadoResult> GenerarConstanciaAsync(long contratoId)
    {
        var info = await GetInfoContratoAsync(contratoId);
        if (info == null)
            return new GenerarCertificadoResult(false, "Contrato no encontrado", null, "");

        QuestPDF.Settings.License = LicenseType.Community;

        var pdfBytes = GenerarPdf(info);
        var nombreArchivo = $"Constancia_{info.NumeroCedulaExtranjeria ?? info.TrabajadorId.ToString()}_{contratoId}.pdf";

        return new GenerarCertificadoResult(true, null, pdfBytes, nombreArchivo);
    }

    private static byte[] GenerarPdf(CertificadoInfoDto info)
    {
        var fechaExpedicion = DateTime.Now;
        var meses = new[] { "", "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre" };

        var fechaTexto = $"{fechaExpedicion.Day} de {meses[fechaExpedicion.Month]} de {fechaExpedicion.Year}";

        var vigenciaDesdeTexto = info.VigenciaDesde.HasValue
            ? $"{info.VigenciaDesde.Value.Day} de {meses[info.VigenciaDesde.Value.Month]} de {info.VigenciaDesde.Value.Year}"
            : "fecha no registrada";

        var vigenciaHastaTexto = info.VigenciaHasta.HasValue
            ? $"{info.VigenciaHasta.Value.Day} de {meses[info.VigenciaHasta.Value.Month]} de {info.VigenciaHasta.Value.Year}"
            : "la fecha";

        var organizacion = info.NombreOrganizacion ?? info.DenominacionContrato ?? "la organización contratante";

        var cuerpoConstancia = $"Que el(la) ciudadano(a) {info.NombreCompleto ?? "N/D"}, " +
            $"identificado(a) con Cédula de Extranjería No. {info.NumeroCedulaExtranjeria ?? "N/D"}, " +
            $"nacional de {info.PaisNacimiento ?? "país no registrado"}, " +
            $"se encuentra registrado(a) en el RUTEC como trabajador(a) extranjero(a) " +
            $"vinculado(a) a {organizacion} " +
            $"en el cargo de {info.CargoTrabajador ?? "no especificado"}" +
            (info.TipoContrato != null ? $", con contrato tipo {info.TipoContrato}" : "") +
            $", con vigencia desde el {vigenciaDesdeTexto} hasta {vigenciaHastaTexto}.";

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.Letter);
                page.MarginHorizontal(60);
                page.MarginVertical(50);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));

                // Header
                page.Header().Column(col =>
                {
                    col.Item().AlignCenter().Text("MINISTERIO DEL TRABAJO")
                        .Bold().FontSize(14);
                    col.Item().AlignCenter().Text("República de Colombia")
                        .FontSize(10).Italic();
                    col.Item().PaddingTop(5).AlignCenter()
                        .Text("RUTEC - Registro Único de Trabajadores Extranjeros en Colombia")
                        .Bold().FontSize(11);
                    col.Item().PaddingTop(15).LineHorizontal(1).LineColor(Colors.Grey.Medium);
                });

                // Content
                page.Content().PaddingVertical(30).Column(col =>
                {
                    col.Item().AlignCenter().PaddingBottom(25)
                        .Text("CONSTANCIA").Bold().FontSize(16);

                    col.Item().Text("El Ministerio del Trabajo, a través del sistema RUTEC, hace constar:")
                        .FontSize(11);

                    col.Item().PaddingTop(15).Text(cuerpoConstancia)
                        .FontSize(11).LineHeight(1.6f);

                    if (info.EsComunidadAndina)
                    {
                        col.Item().PaddingTop(15).Text(
                            "En cumplimiento de la Decisión 545 de la Comunidad Andina, " +
                            "que establece el Instrumento Andino de Migración Laboral, " +
                            "el trabajador extranjero proveniente de un país miembro de la CAN " +
                            "goza de los derechos laborales establecidos en dicha normativa.")
                            .FontSize(11).LineHeight(1.6f).Italic();
                    }

                    col.Item().PaddingTop(25).Text($"Expedida en Bogotá D.C., el {fechaTexto}.")
                        .FontSize(11);
                });

                // Footer
                page.Footer().Column(col =>
                {
                    col.Item().LineHorizontal(1).LineColor(Colors.Grey.Medium);
                    col.Item().PaddingTop(5).AlignCenter()
                        .Text("Este documento es una constancia automática generada por el sistema RUTEC")
                        .FontSize(8).FontColor(Colors.Grey.Darken1);
                    col.Item().AlignCenter()
                        .Text("Ministerio del Trabajo - República de Colombia")
                        .FontSize(8).FontColor(Colors.Grey.Darken1);
                });
            });
        });

        using var ms = new MemoryStream();
        document.GeneratePdf(ms);
        return ms.ToArray();
    }

    private static string BuildNombreCompleto(string? primerNombre, string? segundoNombre,
        string? primerApellido, string? segundoApellido)
    {
        var partes = new[] { primerNombre, segundoNombre, primerApellido, segundoApellido }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        return string.Join(" ", partes);
    }

    private async Task<Dictionary<long, string>> GetOrganizacionNombresAsync(List<long?> orgIds)
    {
        var result = new Dictionary<long, string>();
        if (orgIds.Count == 0) return result;

        try
        {
            var ids = orgIds.Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
            if (ids.Count == 0) return result;

            // Build parameterized query to avoid SQL injection warning
            var parameters = ids.Select((id, i) => new Microsoft.Data.SqlClient.SqlParameter($"@p{i}", id)).ToArray();
            var paramNames = string.Join(",", ids.Select((_, i) => $"@p{i}"));
            var sql = $"SELECT ID_ORGANIZACION AS Id, RAZON_SOCIAL AS Nombre FROM TB_ORGANIZACION WHERE ID_ORGANIZACION IN ({paramNames})";
            var rows = await _db.Database
                .SqlQueryRaw<OrgRow>(sql, parameters)
                .ToListAsync();

            foreach (var row in rows)
            {
                if (row.Nombre != null)
                    result[row.Id] = row.Nombre;
            }
        }
        catch
        {
            // TB_ORGANIZACION may not exist in this DB; silently ignore
        }

        return result;
    }

    private record OrgRow(long Id, string? Nombre);
}
