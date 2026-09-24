using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Auth.Data;
using Shared.Auth.DTOs;
using Shared.Auth.Entities;
using Shared.Auth.Services;

namespace RUTEC.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly JwtTokenService _jwtTokenService;
    private readonly AuthDbContext _authDb;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        JwtTokenService jwtTokenService,
        AuthDbContext authDb)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _jwtTokenService = jwtTokenService;
        _authDb = authDb;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email)
                ?? await _userManager.FindByNameAsync(request.Email);
        if (user == null || !user.Activo)
            return Unauthorized(new { message = "Credenciales invalidas" });

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            if (result.IsLockedOut)
                return Unauthorized(new { message = "Cuenta bloqueada. Intente en 15 minutos." });
            return Unauthorized(new { message = "Credenciales invalidas" });
        }

        user.UltimoAcceso = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _jwtTokenService.GenerateAccessToken(user, roles);
        var refreshToken = _jwtTokenService.GenerateRefreshToken(user.Id);

        var oldTokens = await _authDb.RefreshTokens
            .Where(t => t.UserId == user.Id && t.FechaRevocacion == null)
            .ToListAsync();
        foreach (var t in oldTokens)
            t.FechaRevocacion = DateTime.UtcNow;

        _authDb.RefreshTokens.Add(refreshToken);
        await _authDb.SaveChangesAsync();

        return Ok(new LoginResponse(
            accessToken,
            refreshToken.Token,
            new UserInfo(user.Id, user.Email!, user.NombreCompleto, roles)
        ));
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var principal = _jwtTokenService.GetPrincipalFromExpiredToken(request.AccessToken);
        if (principal == null)
            return Unauthorized(new { message = "Token invalido" });

        var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized(new { message = "Token invalido" });

        var storedToken = await _authDb.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == request.RefreshToken && t.UserId == userId);

        if (storedToken == null || !storedToken.EstaActivo)
            return Unauthorized(new { message = "Refresh token invalido o expirado" });

        storedToken.FechaRevocacion = DateTime.UtcNow;

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null || !user.Activo)
            return Unauthorized(new { message = "Usuario no encontrado" });

        var roles = await _userManager.GetRolesAsync(user);
        var newAccessToken = _jwtTokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = _jwtTokenService.GenerateRefreshToken(userId);

        _authDb.RefreshTokens.Add(newRefreshToken);
        await _authDb.SaveChangesAsync();

        return Ok(new LoginResponse(
            newAccessToken,
            newRefreshToken.Token,
            new UserInfo(user.Id, user.Email!, user.NombreCompleto, roles)
        ));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null)
            return NotFound(new { message = "Usuario no encontrado" });

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        user.PasswordMigrated = true;
        user.LegacyPasswordSalt = null;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "Contrasena actualizada correctamente" });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null)
            return NotFound();

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserInfo(user.Id, user.Email!, user.NombreCompleto, roles));
    }
}
