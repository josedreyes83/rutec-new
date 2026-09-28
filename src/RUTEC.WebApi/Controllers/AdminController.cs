using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;

namespace RUTEC.WebApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _service;
    private readonly IUsuarioActualService _usuarioActual;

    public AdminController(IAdminService service, IUsuarioActualService usuarioActual)
    {
        _service = service;
        _usuarioActual = usuarioActual;
    }

    // ── Usuarios ──────────────────────────────────────────────

    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios()
    {
        var result = await _service.GetUsuariosAsync();
        return Ok(result);
    }

    [HttpGet("usuarios/{id}")]
    public async Task<IActionResult> GetUsuario(string id)
    {
        var result = await _service.GetUsuarioByIdAsync(id);
        return result != null ? Ok(result) : NotFound();
    }

    // ── Códigos de referencia ─────────────────────────────────

    [HttpGet("codigos-referencia")]
    public async Task<IActionResult> GetCodigosReferencia([FromQuery] string? grupo)
    {
        var result = await _service.GetCodigosReferenciaAsync(grupo);
        return Ok(result);
    }

    [HttpPost("codigos-referencia")]
    public async Task<IActionResult> CrearCodigoReferencia([FromBody] CrearCodigoReferenciaDto dto)
    {
        var id = await _service.CrearCodigoReferenciaAsync(dto);
        return Created($"/api/admin/codigos-referencia/{id}", new { id });
    }

    [HttpPut("codigos-referencia/{id}")]
    public async Task<IActionResult> ModificarCodigoReferencia(long id, [FromBody] ModificarCodigoReferenciaDto dto)
    {
        var ok = await _service.ModificarCodigoReferenciaAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("codigos-referencia/{id}")]
    public async Task<IActionResult> EliminarCodigoReferencia(long id)
    {
        var ok = await _service.EliminarCodigoReferenciaAsync(id);
        return ok ? NoContent() : NotFound();
    }

    // ── Empresas ──────────────────────────────────────────────

    [HttpGet("empresas")]
    public async Task<IActionResult> GetEmpresas()
    {
        var result = await _service.GetEmpresasAsync();
        return Ok(result);
    }

    [HttpGet("empresas/{idOrganizacion}/contratos")]
    public async Task<IActionResult> GetContratosEmpresa(long idOrganizacion)
    {
        var result = await _service.GetContratosEmpresaAsync(idOrganizacion);
        return Ok(result);
    }

    // ── Contratos ─────────────────────────────────────────────

    [HttpGet("contratos/{id}")]
    public async Task<IActionResult> GetContrato(long id)
    {
        var result = await _service.GetContratoByIdAsync(id);
        return result != null ? Ok(result) : NotFound();
    }

    [HttpGet("contratos/{id}/full")]
    public async Task<IActionResult> GetContratoFull(long id)
    {
        var result = await _service.GetContratoFullForModificarFechasAsync(id);
        return result != null ? Ok(result) : NotFound();
    }

    [HttpPut("contratos/{id}/fechas")]
    public async Task<IActionResult> ModificarFechasContrato(long id, [FromBody] ModificarFechasContratoDto dto)
    {
        // Antes caia a "admin" cuando el claim faltaba, lo que borraba el
        // rastro justo en la operacion mas sensible del modulo.
        var usuario = await _usuarioActual.ObtenerAsync();
        var ok = await _service.ModificarFechasContratoAsync(id, dto, usuario.Usuario);
        return ok ? NoContent() : NotFound();
    }

    // ── Eliminación masiva ────────────────────────────────────

    [HttpDelete("registros/masivo")]
    public async Task<IActionResult> EliminarMasivo([FromBody] EliminacionMasivaRequest request)
    {
        var result = await _service.EliminarMasivoAsync(request);
        return Ok(result);
    }

    // ── Eliminación individual por tipo ──────────────────────

    [HttpGet("eliminacion/contratos")]
    public async Task<IActionResult> ListarContratosParaEliminar()
    {
        var data = await _service.ListarContratosParaEliminarAsync();
        return Ok(data);
    }

    [HttpDelete("eliminacion/contratos/{id}")]
    public async Task<IActionResult> EliminarContrato(long id)
    {
        var ok = await _service.EliminarContratoDirectoAsync(id);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("eliminacion/trabajadores")]
    public async Task<IActionResult> ListarTrabajadoresParaEliminar()
    {
        var data = await _service.ListarTrabajadoresParaEliminarAsync();
        return Ok(data);
    }

    [HttpDelete("eliminacion/trabajadores/{id}")]
    public async Task<IActionResult> EliminarTrabajador(long id)
    {
        var ok = await _service.EliminarTrabajadorDirectoAsync(id);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("eliminacion/idiomas")]
    public async Task<IActionResult> ListarIdiomasParaEliminar()
    {
        var data = await _service.ListarIdiomasParaEliminarAsync();
        return Ok(data);
    }

    [HttpDelete("eliminacion/idiomas/{id}")]
    public async Task<IActionResult> EliminarIdioma(long id)
    {
        var ok = await _service.EliminarIdiomaDirectoAsync(id);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("eliminacion/niveles")]
    public async Task<IActionResult> ListarNivelesParaEliminar()
    {
        var data = await _service.ListarNivelesParaEliminarAsync();
        return Ok(data);
    }

    [HttpDelete("eliminacion/niveles/{id}")]
    public async Task<IActionResult> EliminarNivel(long id)
    {
        var ok = await _service.EliminarNivelDirectoAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
