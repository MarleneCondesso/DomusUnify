using BCrypt.Net;
using DomusUnify.Api.DTOs.Auth;
using DomusUnify.Api.Services.Auth;
using DomusUnify.Domain.Entities;
using DomusUnify.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

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
    private readonly IExternalIdTokenValidator _externalIdTokenValidator;

    public AuthController(DomusUnifyDbContext db, IJwtTokenService jwt, IExternalIdTokenValidator externalIdTokenValidator)
    {
        _db = db;
        _jwt = jwt;
        _externalIdTokenValidator = externalIdTokenValidator;
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

    /// <summary>
    /// Login com Google (ID token devolvido pelo Google Identity Services).
    /// </summary>
    /// <param name="request">Pedido com o ID token devolvido pelo Google.</param>
    /// <param name="cancellationToken">Token de cancelamento.</param>
    /// <returns>Uma resposta de autenticação com token de acesso e tempo de expiração.</returns>
    [HttpPost("oauth/google")]
    public async Task<ActionResult<AuthResponse>> LoginWithGoogle(ExternalLoginRequest request, CancellationToken cancellationToken)
    {
        ExternalIdTokenUser tokenUser;
        try
        {
            tokenUser = await _externalIdTokenValidator.ValidateGoogleAsync(request.IdToken, cancellationToken);
        }
        catch (InvalidOperationException)
        {
            return BadRequest("Autenticação Google não está configurada no servidor.");
        }
        catch (Exception ex) when (ex is SecurityTokenException or SecurityTokenMalformedException or ArgumentException)
        {
            return Unauthorized("Token inválido.");
        }

        if (tokenUser.EmailVerified != true)
            return Unauthorized("O email do utilizador não está verificado no Google.");

        var user = await GetOrCreateExternalUserAsync(
            provider: "google",
            tokenUser: tokenUser,
            cancellationToken: cancellationToken);

        var (token, expires) = _jwt.CreateToken(user);
        return Ok(new AuthResponse { AccessToken = token, ExpiresAtUtc = expires });
    }

    private async Task<User> GetOrCreateExternalUserAsync(
        string provider,
        ExternalIdTokenUser tokenUser,
        CancellationToken cancellationToken)
    {
        var subject = tokenUser.Subject.Trim();

        var existingLogin = await _db.UserExternalLogins
            .Include(x => x.User)
            .FirstOrDefaultAsync(
                x => x.Provider == provider && x.ProviderSubject == subject,
                cancellationToken);

        if (existingLogin is not null)
            return existingLogin.User;

        if (string.IsNullOrWhiteSpace(tokenUser.Email))
            throw new SecurityTokenException("Não foi possível obter o email do provider.");

        var email = tokenUser.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
        if (user is null)
        {
            user = new User
            {
                Name = ResolveName(tokenUser, email),
                Email = email,
                // Cria um hash aleatório para contas externas (não permite login por password).
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"))
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync(cancellationToken);
        }

        _db.UserExternalLogins.Add(new UserExternalLogin
        {
            UserId = user.Id,
            Provider = provider,
            ProviderSubject = subject,
            Email = email
        });

        await _db.SaveChangesAsync(cancellationToken);

        return user;
    }

    private static string ResolveName(ExternalIdTokenUser tokenUser, string email)
    {
        if (!string.IsNullOrWhiteSpace(tokenUser.Name))
            return tokenUser.Name.Trim();

        var at = email.IndexOf('@');
        return at > 0 ? email[..at] : email;
    }
}
