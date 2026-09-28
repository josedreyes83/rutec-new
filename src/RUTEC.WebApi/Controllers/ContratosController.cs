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
    private readonly IUsuarioActualService _usuarioActual;

    public ContratosController(IContratoService service, IUsuarioActualService usuarioActual)
    {
        _service = service;
        _usuarioActual = usuarioActual;
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
        var usuario = await _usuarioActual.ObtenerAsync();

        // Un contrato pertenece a una empresa. Antes se guardaba 0 cuando no
        // habia como saber cual, y eso dejo filas huerfanas que ningun reporte
        // por empresa alcanza. Mejor negar el registro que seguir creandolas.
        if (usuario.IdOrganizacion is not { } idOrganizacion)
            return BadRequest(new { message = "El usuario no esta asociado a una empresa registrada en RUE." });

        var id = await _service.CrearAsync(trabajadorId, dto, idOrganizacion, usuario.Usuario);
        var result = await _service.GetByIdAsync(id);
        return CreatedAtAction(nameof(GetById), new { trabajadorId, id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Modificar(long id, [FromBody] ModificarContratoDto dto)
    {
        var usuario = await _usuarioActual.ObtenerAsync();
        var ok = await _service.ModificarAsync(id, dto, usuario.Usuario);
        return ok ? NoContent() : NotFound();
    }

    [HttpPut("{id}/finalizar")]
    public async Task<IActionResult> Finalizar(long id)
    {
        var usuario = await _usuarioActual.ObtenerAsync();
        var ok = await _service.FinalizarAsync(id, usuario.Usuario);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(long id, [FromBody] EliminarContratoDto dto)
    {
        var usuario = await _usuarioActual.ObtenerAsync();
        var ok = await _service.EliminarAsync(id, dto, usuario.Usuario);
        return ok ? NoContent() : NotFound();
    }
}
