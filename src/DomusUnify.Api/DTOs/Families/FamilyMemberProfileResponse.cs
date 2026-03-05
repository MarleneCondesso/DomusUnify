namespace DomusUnify.Api.DTOs.Families;

/// <summary>
/// Resposta com informaÃ§Ã£o de perfil de um membro dentro de uma famÃ­lia.
/// </summary>
public sealed class FamilyMemberProfileResponse
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
    /// EndereÃ§o de email.
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Nome de exibiÃ§Ã£o (opcional).
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// Cor do perfil (hex), ex.: <c>#8b5cf6</c> (opcional).
    /// </summary>
    public string? ProfileColorHex { get; set; }

    /// <summary>
    /// Data de aniversÃ¡rio (opcional).
    /// </summary>
    public DateOnly? Birthday { get; set; }

    /// <summary>
    /// Papel do utilizador na famÃ­lia.
    /// </summary>
    public string Role { get; set; } = null!;
}

