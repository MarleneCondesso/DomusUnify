namespace DomusUnify.Api.DTOs.Auth;

/// <summary>
/// Pedido de registo de utilizador.
/// </summary>
public sealed class RegisterRequest
{
    /// <summary>
    /// Nome do utilizador.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Email do utilizador.
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Palavra-passe do utilizador.
    /// </summary>
    public string Password { get; set; } = null!;
}
