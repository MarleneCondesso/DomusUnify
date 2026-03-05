namespace DomusUnify.Api.DTOs.Users;

/// <summary>
/// Pedido para atualizar o perfil do utilizador autenticado.
/// </summary>
public sealed class UpdateUserProfileRequest
{
    /// <summary>
    /// Nome de exibição (opcional). Envia <c>null</c> para remover.
    /// </summary>
    public string? DisplayName { get; set; }

    /// <summary>
    /// Cor do perfil (hex), ex.: <c>#8b5cf6</c> (opcional). Envia <c>null</c> para remover.
    /// </summary>
    public string? ProfileColorHex { get; set; }

    /// <summary>
    /// Data de aniversário (opcional). Envia <c>null</c> para remover.
    /// </summary>
    public DateOnly? Birthday { get; set; }

    /// <summary>
    /// Género (opcional): <c>female</c>, <c>male</c>, <c>other</c>. Envia <c>null</c> para remover.
    /// </summary>
    public string? Gender { get; set; }

    /// <summary>
    /// Telefone (opcional). Envia <c>null</c> para remover.
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// Morada/endereço (opcional). Envia <c>null</c> para remover.
    /// </summary>
    public string? Address { get; set; }
}

