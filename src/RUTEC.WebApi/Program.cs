using Microsoft.EntityFrameworkCore;
using RUTEC.Infrastructure.Data;
using Serilog;
using Shared.Auth;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration));

// Auth (Identity + JWT) - shared with RUE
builder.Services.AddSharedAuth(builder.Configuration);

// RUTEC DbContext
builder.Services.AddDbContext<RutecDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("RutecConnection")));

// RUE DbContext (read-only, for organization data)
builder.Services.AddDbContext<RueReadOnlyDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("RueConnection")));

// Application Services
builder.Services.AddScoped<RUTEC.Application.Services.ITrabajadorService, RUTEC.Infrastructure.Services.TrabajadorServiceImpl>();
builder.Services.AddScoped<RUTEC.Application.Services.IContratoService, RUTEC.Infrastructure.Services.ContratoServiceImpl>();
builder.Services.AddScoped<RUTEC.Application.Services.ICalidadService, RUTEC.Infrastructure.Services.CalidadServiceImpl>();
builder.Services.AddScoped<RUTEC.Application.Services.IReporteService, RUTEC.Infrastructure.Services.ReporteServiceImpl>();
builder.Services.AddScoped<RUTEC.Application.Services.IAdminService, RUTEC.Infrastructure.Services.AdminServiceImpl>();
builder.Services.AddScoped<RUTEC.Application.Services.ICertificadoService, RUTEC.Infrastructure.Services.CertificadoServiceImpl>();

// Identidad del usuario de la peticion. Scoped porque memoiza la busqueda
// de la organizacion en RUE por peticion.
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<RUTEC.Application.Services.IUsuarioActualService, RUTEC.WebApi.Services.UsuarioActualService>();

// Cache
builder.Services.AddMemoryCache();

// Controllers
builder.Services.AddControllers();

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
// El SPA compilado se sirve desde este mismo host (mismo origen, no requiere CORS).
// La lista se mantiene para el dev server de Angular y para origenes publicos
// adicionales declarados en appsettings.{Environment}.json -> "PublicOrigins".
var corsOrigins = new List<string> { "http://localhost:4201" };
corsOrigins.AddRange(builder.Configuration.GetSection("PublicOrigins").Get<string[]>() ?? []);

builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
    {
        policy.WithOrigins([.. corsOrigins])
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Seed roles for RUTEC
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<Shared.Auth.Entities.ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Identity.RoleManager<Shared.Auth.Entities.ApplicationRole>>();

    // Create RUTEC-specific roles
    foreach (var role in new[] { "Admin", "Usuario", "Verificador" })
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new Shared.Auth.Entities.ApplicationRole { Name = role, Aplicacion = "RUTEC" });
    }

    // Ensure admin user exists (may already exist from RUE)
    if (await userManager.FindByEmailAsync("admin@mintrabajo.gov.co") == null)
    {
        var admin = new Shared.Auth.Entities.ApplicationUser
        {
            UserName = "admin",
            Email = "admin@mintrabajo.gov.co",
            NombreCompleto = "Administrador RUTEC",
            EmailConfirmed = true,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };
        await userManager.CreateAsync(admin, "Admin1234");
        await userManager.AddToRoleAsync(admin, "Admin");
    }

    // Ensure legacy user exists (may already exist from RUE)
    if (await userManager.FindByNameAsync("79835450") == null)
    {
        var legacyUser = new Shared.Auth.Entities.ApplicationUser
        {
            UserName = "79835450",
            Email = "javierjpinto@gmail.com",
            NombreCompleto = "Usuario Legacy 79835450",
            EmailConfirmed = true,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };
        await userManager.CreateAsync(legacyUser, "Urz7Cd");
        await userManager.AddToRoleAsync(legacyUser, "Admin");
    }

    // Migrate legacy users from aspnet_Membership (same pattern as RUE)
    var authDb = scope.ServiceProvider.GetRequiredService<Shared.Auth.Data.AuthDbContext>();
    var existingUserData = await authDb.Users.Select(u => new { u.UserName, u.Email }).ToListAsync();
    var existingSet = new HashSet<string>(existingUserData.Select(u => u.UserName).Where(u => u != null)!, StringComparer.OrdinalIgnoreCase);
    var usedEmails = new HashSet<string>(existingUserData.Select(u => u.Email).Where(e => e != null)!.Select(e => e!.ToUpperInvariant()), StringComparer.OrdinalIgnoreCase);

    var legacyUsers = await authDb.Database.SqlQueryRaw<LegacyUserRow>(
        @"SELECT u.UserName, m.Email, m.Password, m.PasswordSalt,
                 m.CreateDate, m.LastLoginDate, m.LastPasswordChangedDate, m.IsLockedOut
          FROM aspnet_Users u
          JOIN aspnet_Membership m ON u.UserId = m.UserId"
    ).ToListAsync();

    int migrated = 0;
    var processedUserNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    foreach (var lu in legacyUsers)
    {
        if (existingSet.Contains(lu.UserName)) continue;
        if (!processedUserNames.Add(lu.UserName)) continue;

        var email = lu.Email?.Trim();
        var normalizedEmail = email?.ToUpperInvariant();
        if (string.IsNullOrEmpty(email) || usedEmails.Contains(normalizedEmail!))
            email = $"{lu.UserName}@legacy.rutec.gov.co";
        usedEmails.Add(email.ToUpperInvariant());

        var newUser = new Shared.Auth.Entities.ApplicationUser
        {
            UserName = lu.UserName,
            NormalizedUserName = lu.UserName.ToUpperInvariant(),
            Email = email,
            NormalizedEmail = email.ToUpperInvariant(),
            EmailConfirmed = true,
            PasswordHash = lu.Password,
            LegacyPasswordSalt = lu.PasswordSalt,
            PasswordMigrated = false,
            Activo = !lu.IsLockedOut,
            FechaCreacion = lu.CreateDate,
            UltimoAcceso = lu.LastLoginDate,
            SecurityStamp = Guid.NewGuid().ToString()
        };

        authDb.Users.Add(newUser);
        migrated++;
    }

    if (migrated > 0)
    {
        await authDb.SaveChangesAsync();
        var migratedUsers = await authDb.Users
            .Where(u => u.PasswordMigrated == false && u.LegacyPasswordSalt != null)
            .ToListAsync();
        foreach (var mu in migratedUsers)
        {
            if (!await userManager.IsInRoleAsync(mu, "Usuario"))
                await userManager.AddToRoleAsync(mu, "Usuario");
        }
        Log.Information("Migrados {Count} usuarios legacy a Identity", migrated);
    }
}

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Solo redirigir a HTTPS si efectivamente hay un endpoint HTTPS escuchando;
// de lo contrario el redirect apunta a un puerto muerto.
var httpsConfigurado = app.Urls.Any(u => u.StartsWith("https:", StringComparison.OrdinalIgnoreCase))
    || !string.IsNullOrEmpty(builder.Configuration["ASPNETCORE_HTTPS_PORT"])
    || !string.IsNullOrEmpty(builder.Configuration["HTTPS_PORT"]);
if (httpsConfigurado)
    app.UseHttpsRedirection();

// SPA Angular compilado en wwwroot (index.html + assets)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("Angular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Cualquier ruta que no sea /api ni un archivo estatico la resuelve el router de Angular
app.MapFallbackToFile("index.html");

app.Run();

record LegacyUserRow(string UserName, string? Email, string Password, string PasswordSalt,
    DateTime CreateDate, DateTime? LastLoginDate, DateTime? LastPasswordChangedDate, bool IsLockedOut);
