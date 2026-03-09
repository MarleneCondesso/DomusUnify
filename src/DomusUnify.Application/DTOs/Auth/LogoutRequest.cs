namespace DomusUnify.Api.DTOs.Auth;

/// <summary>
/// Pedido para terminar a sessão persistente atual.
/// </summary>
public sealed class LogoutRequest
{
    /// <summary>
    /// Refresh token da sessão a revogar.
    /// </summary>
    public string? RefreshToken { get; set; }
}
