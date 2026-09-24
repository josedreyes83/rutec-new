using RUTEC.Application.DTOs;

namespace RUTEC.Application.Services;

public interface IReporteService
{
    Task<ReporteGeneralDto> GetGeneralAsync();
    Task<List<ReporteItemDto>> GetPorGeneroAsync();
    Task<List<ReporteItemDto>> GetPorNacionalidadAsync();
    Task<List<ReporteItemDto>> GetPorNivelAcademicoAsync();
    Task<List<ReporteItemDto>> GetPorSectorEconomicoAsync();
    Task<List<ReporteItemDto>> GetPorZonaAsync();
    Task<List<ReporteItemDto>> GetPorAnoNacimientoAsync();
    Task<List<ReporteEmpresaRegistradaDto>> GetEmpresasRegistradasAsync();
    Task<List<ReporteItemDto>> GetCantidadTrabajadoresAsync();
    Task<List<ReporteItemDto>> GetRueGeneralAsync();
    Task<List<ReporteItemDto>> GetRueDiaAsync();
    Task<List<ReporteItemDto>> GetGestionGeneralAsync();
    Task<List<ReporteItemDto>> GetGestionDiaAsync();
    Task<byte[]> ExportarExcelAsync(string tipo);
    Task<object> GetDashboardAsync(DateTime? fechaDesde = null, DateTime? fechaHasta = null, string? pais = null);
    Task<object> GetDashboardRueAsync(DateTime? fechaDesde = null, DateTime? fechaHasta = null);
}
