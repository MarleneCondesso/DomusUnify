namespace DomusUnify.Api.DTOs.Lists;

/// <summary>
/// Pedido para criar uma nova lista.
/// </summary>
public sealed class CreateListRequest
{
    /// <summary>
    /// Nome da lista.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Tipo de lista (<c>Shopping</c>, <c>Tasks</c> ou <c>Custom</c>).
    /// </summary>
    public string Type { get; set; } = "Custom"; // Shopping | Tasks | Custom

    /// <summary>
    /// Cor da lista em hexadecimal (ex.: <c>#FFAA00</c>).
    /// </summary>
    public string ColorHex { get; set; } = "";

    /// <summary>
    /// Modo de visibilidade da lista (<c>Private</c>, <c>AllMembers</c> ou <c>SpecificMembers</c>).
    /// </summary>
    public string VisibilityMode { get; set; } = "AllMembers";

    /// <summary>
    /// Lista de utilizadores com acesso quando a visibilidade é <c>SpecificMembers</c>.
    /// </summary>
    public List<Guid>? AllowedUserIds { get; set; }
}
