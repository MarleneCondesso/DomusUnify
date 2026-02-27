namespace DomusUnify.Api.DTOs.Lists;

/// <summary>
/// Pedido para atualizar uma lista.
/// </summary>
public sealed class UpdateListRequest
{
    /// <summary>
    /// Nome da lista.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Cor da lista em hexadecimal (ex.: <c>#FFAA00</c>).
    /// </summary>
    public string ColorHex { get; set; } = "";

    /// <summary>
    /// Tipo de lista (<c>Shopping</c>, <c>Tasks</c> ou <c>Custom</c>).
    /// </summary>
    public string Type { get; set; } = "Custom"; // Shopping | Tasks | Custom

    /// <summary>
    /// Novo modo de visibilidade (opcional).
    /// </summary>
    public string? VisibilityMode { get; set; }

    /// <summary>
    /// Lista de utilizadores com acesso, quando aplicável (opcional).
    /// </summary>
    public List<Guid>? AllowedUserIds { get; set; }
}
