using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;

namespace RUTEC.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TrabajadoresController : ControllerBase
{
    private readonly ITrabajadorService _service;

    public TrabajadoresController(ITrabajadorService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] TrabajadorFiltroDto filtro)
    {
        var result = await _service.GetAllAsync(filtro);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var result = await _service.GetByIdAsync(id);
        return result != null ? Ok(result) : NotFound();
    }

    [HttpGet("buscar")]
    public async Task<IActionResult> BuscarPorCedula([FromQuery] string cedula)
    {
        var result = await _service.BuscarPorCedulaAsync(cedula);
        return result != null ? Ok(result) : NotFound();
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearTrabajadorDto dto)
    {
        // TODO: Extract idOrganizacion and usuarioRegistro from claims
        var id = await _service.CrearAsync(dto, 0, "system");
        var result = await _service.GetByIdAsync(id);
        return CreatedAtAction(nameof(GetById), new { id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Modificar(long id, [FromBody] ModificarTrabajadorDto dto)
    {
        var ok = await _service.ModificarAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }

    [HttpPut("{id}/documento")]
    public async Task<IActionResult> ModificarDocumento(long id, [FromBody] ModificarDocumentoDto dto)
    {
        var ok = await _service.ModificarDocumentoAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }
}
