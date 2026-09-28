using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RUTEC.Application.DTOs;
using RUTEC.Application.Services;
using Shared.Auth.Data;
using Shared.Auth.Entities;

namespace RUTEC.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Verificador")]
public class CalidadController : ControllerBase
{
    private readonly ICalidadService _service;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AuthDbContext _authDb;
    private readonly IUsuarioActualService _usuarioActual;

    public CalidadController(
        ICalidadService service,
        UserManager<ApplicationUser> userManager,
        AuthDbContext authDb,
        IUsuarioActualService usuarioActual)
    {
        _service = service;
        _userManager = userManager;
        _authDb = authDb;
        _usuarioActual = usuarioActual;
    }

    [HttpGet("empresas")]
    public async Task<IActionResult> GetEmpresas() => Ok(await _service.GetEmpresasAsync());

    [HttpGet("empresas/pendientes")]
    public async Task<IActionResult> GetPendientes() => Ok(await _service.GetEmpresasPendientesAsync());

    [HttpGet("empresas/aprobadas")]
    public async Task<IActionResult> GetAprobadas() => Ok(await _service.GetEmpresasAprobadasAsync());

    [HttpGet("empresas/{idOrganizacion}/contratos")]
    public async Task<IActionResult> GetContratos(long idOrganizacion) => Ok(await _service.GetContratosEmpresaAsync(idOrganizacion));

    [HttpGet("verificadores")]
    public async Task<IActionResult> GetVerificadores() => Ok(await _service.GetVerificadoresAsync());

    [HttpPost("contratos/{contratoId}/verificador")]
    public async Task<IActionResult> AsignarVerificador(long contratoId, [FromBody] AsignarVerificadorDto dto)
    {
        var ok = await _service.AsignarVerificadorAsync(contratoId, dto);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("contratos-gestion")]
    public async Task<IActionResult> GetContratosGestion([FromQuery] string estado = "por-aclarar", [FromQuery] string? verificador = null)
    {
        // Sin filtro explicito, el verificador ve lo suyo (comportamiento legado).
        var usuario = verificador ?? (await _usuarioActual.ObtenerAsync()).Usuario;
        return Ok(await _service.GetContratosGestionAsync(estado, usuario));
    }

    [HttpGet("verificador/{usuario}/contratos")]
    public async Task<IActionResult> GetContratosVerificador(string usuario)
        => Ok(await _service.GetContratosVerificadorAsync(usuario));

    [HttpDelete("verificacion/{id}")]
    public async Task<IActionResult> EliminarVerificacion(long id)
    {
        var ok = await _service.EliminarVerificacionAsync(id);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("contrato-detalle/{contratoId}")]
    public async Task<IActionResult> GetContratoDetalle(long contratoId)
    {
        var result = await _service.GetContratoDetalleVerificacionAsync(contratoId);
        return result != null ? Ok(result) : NotFound();
    }

    [HttpGet("motivos-aclaracion")]
    public async Task<IActionResult> GetMotivosAclaracion() => Ok(await _service.GetMotivosAclaracionAsync());

    [HttpPost("contratos/{contratoId}/verificacion")]
    public async Task<IActionResult> RegistrarVerificacion(long contratoId, [FromBody] RegistrarAclaracionDto dto)
    {
        // Antes caia a "system" si faltaba el claim: la verificacion quedaba
        // registrada a nombre de nadie.
        var usuario = await _usuarioActual.ObtenerAsync();
        var ok = await _service.RegistrarVerificacionAsync(contratoId, dto, usuario.Usuario);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("contratos-disponibles-count")]
    public async Task<IActionResult> GetContratosDisponiblesCount()
    {
        var count = await _service.GetContratosDisponiblesCountAsync();
        return Ok(new { count });
    }

    [HttpGet("usuarios-admin")]
    public async Task<IActionResult> GetUsuariosAdmin()
    {
        // Legacy reads from TB_PERMISO_ADMIN WHERE app='RUTEC' AND tipo='admin'
        var usernames = await _authDb.Database
            .SqlQueryRaw<string>("SELECT UserName AS Value FROM TB_PERMISO_ADMIN WHERE app = 'RUTEC' AND tipo = 'admin'")
            .ToListAsync();
        var result = usernames
            .OrderBy(u => u, StringComparer.OrdinalIgnoreCase)
            .Select(u => new { userName = u })
            .ToList();
        return Ok(result);
    }

    [HttpPost("asignar-contratos-masivo")]
    public async Task<IActionResult> AsignarContratosMasivo([FromBody] AsignarContratosMasivoDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Usuario) || dto.Cantidad <= 0)
            return BadRequest(new { message = "Usuario y cantidad son requeridos." });

        var asignados = await _service.AsignarContratosMasivoAsync(dto.Usuario, dto.Cantidad);
        return Ok(new { asignados });
    }

    public record AsignarContratoUnicoDto(string Usuario, long ContratoId);

    [HttpPost("asignar-contrato-unico")]
    public async Task<IActionResult> AsignarContratoUnico([FromBody] AsignarContratoUnicoDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Usuario) || dto.ContratoId <= 0)
            return BadRequest(new { message = "Usuario y contrato son requeridos." });

        var (ok, error) = await _service.AsignarContratoUnicoAsync(dto.Usuario, dto.ContratoId);
        return ok ? Ok(new { ok = true }) : BadRequest(new { message = error });
    }
}
