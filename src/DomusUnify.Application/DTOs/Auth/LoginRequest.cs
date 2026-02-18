namespace DomusUnify.Api.DTOs.Auth;

/// <summary>
/// Pedido de autenticação (login).
/// </summary>
public sealed class LoginRequest
{
    /// <summary>
    /// Email do utilizador.
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Palavra-passe do utilizador.
    /// </summary>
    public string Password { get; set; } = null!;
}
