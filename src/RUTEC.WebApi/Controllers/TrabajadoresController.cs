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
    private readonly IUsuarioActualService _usuarioActual;

    public TrabajadoresController(ITrabajadorService service, IUsuarioActualService usuarioActual)
    {
        _service = service;
        _usuarioActual = usuarioActual;
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
        var usuario = await _usuarioActual.ObtenerAsync();

        // Mismo criterio que en contratos: sin empresa no se registra, para
        // no seguir generando trabajadores con ID_ORGANIZACION = 0.
        if (usuario.IdOrganizacion is not { } idOrganizacion)
            return BadRequest(new { message = "El usuario no esta asociado a una empresa registrada en RUE." });

        var id = await _service.CrearAsync(dto, idOrganizacion, usuario.Usuario);
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
