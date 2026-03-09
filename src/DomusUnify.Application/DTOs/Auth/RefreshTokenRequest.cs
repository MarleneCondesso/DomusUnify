namespace DomusUnify.Api.DTOs.Auth;

/// <summary>
/// Pedido para renovar uma sessão usando refresh token.
/// </summary>
public sealed class RefreshTokenRequest
{
    /// <summary>
    /// Refresh token emitido anteriormente.
    /// </summary>
    public string RefreshToken { get; set; } = null!;
}
