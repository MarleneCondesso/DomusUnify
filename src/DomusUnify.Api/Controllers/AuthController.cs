using BCrypt.Net;
using DomusUnify.Api.DTOs.Auth;
using DomusUnify.Api.Services.Auth;
using DomusUnify.Domain.Entities;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints de autenticação e registo de utilizadores.
/// </summary>
[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly DomusUnifyDbContext _db;
    private readonly IJwtTokenService _jwt;

    public AuthController(DomusUnifyDbContext db, IJwtTokenService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    /// <summary>
    /// Registra um novo utilizador com os detalhes fornecidos.
    /// </summary>
    /// <remarks>
    /// O email deve ser único. A palavra-passe é encriptada antes de ser armazenada.
    /// </remarks>
    /// <param name="request">O pedido de registo contendo nome, email e palavra-passe.</param>
    /// <returns>Uma resposta de autenticação com token de acesso e tempo de expiração.</returns>
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var exists = await _db.Users.AnyAsync(u => u.Email == email);
        if (exists) return BadRequest("Email já registado.");

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var (token, expires) = _jwt.CreateToken(user);

        return Ok(new AuthResponse { AccessToken = token, ExpiresAtUtc = expires });
    }

    /// <summary>
    /// Autentica um utilizador existente e retorna um token de acesso.
    /// </summary>
    /// <remarks>
    /// Verifica as credenciais fornecidas. Se inválidas, retorna erro de não autorizado.
    /// </remarks>
    /// <param name="request">O pedido de login contendo email e palavra-passe.</param>
    /// <returns>Uma resposta de autenticação com token de acesso e tempo de expiração.</returns>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null) return Unauthorized("Credenciais inválidas.");

        var ok = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!ok) return Unauthorized("Credenciais inválidas.");

        var (token, expires) = _jwt.CreateToken(user);

        return Ok(new AuthResponse { AccessToken = token, ExpiresAtUtc = expires });
    }
}
