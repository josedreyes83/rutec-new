using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;

namespace RUTEC.WebApi.Controllers;

[ApiController]
[Route("api/trabajadores/{trabajadorId}/contratos")]
[Authorize]
public class ContratosController : ControllerBase
{
    private readonly IContratoService _service;

    public ContratosController(IContratoService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetByTrabajador(long trabajadorId)
    {
        var result = await _service.GetByTrabajadorAsync(trabajadorId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var result = await _service.GetByIdAsync(id);
        return result != null ? Ok(result) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Crear(long trabajadorId, [FromBody] CrearContratoDto dto)
    {
        var id = await _service.CrearAsync(trabajadorId, dto, 0, "0");
        var result = await _service.GetByIdAsync(id);
        return CreatedAtAction(nameof(GetById), new { trabajadorId, id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Modificar(long id, [FromBody] ModificarContratoDto dto)
    {
        var ok = await _service.ModificarAsync(id, dto, "0");
        return ok ? NoContent() : NotFound();
    }

    [HttpPut("{id}/finalizar")]
    public async Task<IActionResult> Finalizar(long id)
    {
        var ok = await _service.FinalizarAsync(id, "0");
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(long id, [FromBody] EliminarContratoDto dto)
    {
        var ok = await _service.EliminarAsync(id, dto, "0");
        return ok ? NoContent() : NotFound();
    }
}
