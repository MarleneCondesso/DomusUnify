namespace DomusUnify.Api.DTOs.Auth;

/// <summary>
/// Resposta de autenticação com token de acesso.
/// </summary>
public sealed class AuthResponse
{
    /// <summary>
    /// Token JWT de acesso.
    /// </summary>
    public string AccessToken { get; set; } = null!;

    /// <summary>
    /// Data/hora de expiração do token (UTC).
    /// </summary>
    public DateTime ExpiresAtUtc { get; set; }

    /// <summary>
    /// Refresh token para renovar silenciosamente a sessão.
    /// </summary>
    public string RefreshToken { get; set; } = null!;

    /// <summary>
    /// Data/hora de expiração do refresh token (UTC).
    /// </summary>
    public DateTime RefreshTokenExpiresAtUtc { get; set; }
}
