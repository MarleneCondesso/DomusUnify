namespace DomusUnify.Api.DTOs.Users;

/// <summary>
/// Resposta com informação do perfil do utilizador autenticado.
/// </summary>
public sealed class UserProfileResponse
{
    /// <summary>
    /// Identificador do utilizador.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Nome (registo).
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Endereço de email.
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Nome de exibição (opcional).
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// Cor do perfil (hex), ex.: <c>#8b5cf6</c> (opcional).
    /// </summary>
    public string? ProfileColorHex { get; set; }

    /// <summary>
    /// Data de aniversário (opcional).
    /// </summary>
    public DateOnly? Birthday { get; set; }

    /// <summary>
    /// Género (opcional): <c>female</c>, <c>male</c>, <c>other</c>.
    /// </summary>
    public string? Gender { get; set; }

    /// <summary>
    /// Telefone (opcional).
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// Morada/endereço (opcional).
    /// </summary>
    public string? Address { get; set; }
}

