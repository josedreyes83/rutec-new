using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RUTEC.Application.Services;

namespace RUTEC.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CertificadosController : ControllerBase
{
    private readonly ICertificadoService _service;

    public CertificadosController(ICertificadoService service)
    {
        _service = service;
    }

    [HttpGet("trabajador/{trabajadorId}")]
    public async Task<IActionResult> GetByTrabajador(long trabajadorId)
    {
        var result = await _service.GetByTrabajadorAsync(trabajadorId);
        return Ok(result);
    }

    [HttpGet("info/{contratoId}")]
    public async Task<IActionResult> GetInfoContrato(long contratoId)
    {
        var result = await _service.GetInfoContratoAsync(contratoId);
        return result != null ? Ok(result) : NotFound();
    }

    [HttpGet("generar/{contratoId}")]
    public async Task<IActionResult> GenerarConstancia(long contratoId)
    {
        var result = await _service.GenerarConstanciaAsync(contratoId);
        if (!result.Ok) return BadRequest(new { message = result.Error });
        return File(result.PdfBytes!, "application/pdf", result.NombreArchivo);
    }
}
