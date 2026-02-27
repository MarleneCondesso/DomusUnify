namespace DomusUnify.Api.DTOs.Auth;

/// <summary>
/// Pedido de login via provider externo (ex.: Google).
/// </summary>
public sealed class ExternalLoginRequest
{
    /// <summary>
    /// ID token (JWT) devolvido pelo provider.
    /// </summary>
    public string IdToken { get; set; } = null!;
}
