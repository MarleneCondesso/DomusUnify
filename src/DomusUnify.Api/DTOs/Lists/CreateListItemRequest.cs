namespace DomusUnify.Api.DTOs.Lists;

/// <summary>
/// Pedido para criar um novo item numa lista.
/// </summary>
public sealed class CreateListItemRequest
{
    /// <summary>
    /// Nome do item.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Identificador da categoria do item (opcional).
    /// </summary>
    public Guid? CategoryId { get; set; }

    /// <summary>
    /// Identificador do utilizador a quem o item estÃ¡ atribuÃ­do (opcional).
    /// </summary>
    public Guid? AssigneeUserId { get; set; }

    /// <summary>
    /// Nota opcional associada ao item.
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// URL (ou data URL) de uma foto associada ao item (opcional).
    /// </summary>
    public string? PhotoUrl { get; set; }
}
