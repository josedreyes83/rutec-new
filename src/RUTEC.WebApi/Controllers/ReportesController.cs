using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RUTEC.Application.Services;

namespace RUTEC.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ReportesController : ControllerBase
{
    private readonly IReporteService _service;

    public ReportesController(IReporteService service)
    {
        _service = service;
    }

    [HttpGet("general")]
    public async Task<IActionResult> GetGeneral()
        => Ok(await _service.GetGeneralAsync());

    [HttpGet("genero")]
    public async Task<IActionResult> GetPorGenero()
        => Ok(await _service.GetPorGeneroAsync());

    [HttpGet("nacionalidad")]
    public async Task<IActionResult> GetPorNacionalidad()
        => Ok(await _service.GetPorNacionalidadAsync());

    [HttpGet("nivel-academico")]
    public async Task<IActionResult> GetPorNivelAcademico()
        => Ok(await _service.GetPorNivelAcademicoAsync());

    [HttpGet("sector-economico")]
    public async Task<IActionResult> GetPorSectorEconomico()
        => Ok(await _service.GetPorSectorEconomicoAsync());

    [HttpGet("zona")]
    public async Task<IActionResult> GetPorZona()
        => Ok(await _service.GetPorZonaAsync());

    [HttpGet("ano-nacimiento")]
    public async Task<IActionResult> GetPorAnoNacimiento()
        => Ok(await _service.GetPorAnoNacimientoAsync());

    [HttpGet("empresas-registradas")]
    public async Task<IActionResult> GetEmpresasRegistradas()
        => Ok(await _service.GetEmpresasRegistradasAsync());

    [HttpGet("cantidad-trabajadores")]
    public async Task<IActionResult> GetCantidadTrabajadores()
        => Ok(await _service.GetCantidadTrabajadoresAsync());

    [HttpGet("rue-general")]
    public async Task<IActionResult> GetRueGeneral()
        => Ok(await _service.GetRueGeneralAsync());

    [HttpGet("rue-dia")]
    public async Task<IActionResult> GetRueDia()
        => Ok(await _service.GetRueDiaAsync());

    [HttpGet("gestion-general")]
    public async Task<IActionResult> GetGestionGeneral()
        => Ok(await _service.GetGestionGeneralAsync());

    [HttpGet("gestion-dia")]
    public async Task<IActionResult> GetGestionDia()
        => Ok(await _service.GetGestionDiaAsync());

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] DateTime? fechaDesde, [FromQuery] DateTime? fechaHasta, [FromQuery] string? pais)
        => Ok(await _service.GetDashboardAsync(fechaDesde, fechaHasta, pais));

    [HttpGet("dashboard-rue")]
    public async Task<IActionResult> GetDashboardRue([FromQuery] DateTime? fechaDesde, [FromQuery] DateTime? fechaHasta)
        => Ok(await _service.GetDashboardRueAsync(fechaDesde, fechaHasta));

    [HttpGet("exportar-excel")]
    public async Task<IActionResult> ExportarExcel([FromQuery] string tipo)
    {
        if (string.IsNullOrWhiteSpace(tipo))
            return BadRequest("El parametro 'tipo' es requerido.");

        try
        {
            var bytes = await _service.ExportarExcelAsync(tipo);
            return File(bytes,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"reporte-{tipo}-{DateTime.Now:yyyyMMdd}.xlsx");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
