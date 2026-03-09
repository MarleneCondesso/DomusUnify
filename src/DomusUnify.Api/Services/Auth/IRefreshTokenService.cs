using DomusUnify.Domain.Entities;

namespace DomusUnify.Api.Services.Auth;

/// <summary>
/// Gere emissão, rotação e revogação de refresh tokens persistidos.
/// </summary>
public interface IRefreshTokenService
{
    /// <summary>
    /// Cria um novo refresh token para um utilizador.
    /// </summary>
    Task<(string token, DateTime expiresAtUtc)> CreateAsync(User user, string? userAgent, CancellationToken ct = default);

    /// <summary>
    /// Roda um refresh token válido e devolve a sessão renovada.
    /// </summary>
    Task<(User user, string token, DateTime expiresAtUtc)?> RotateAsync(string refreshToken, string? userAgent, CancellationToken ct = default);

    /// <summary>
    /// Revoga um refresh token, se existir.
    /// </summary>
    Task RevokeAsync(string refreshToken, Guid? userId = null, CancellationToken ct = default);
}
