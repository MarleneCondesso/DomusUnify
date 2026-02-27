namespace DomusUnify.Api.DTOs.Lists;

/// <summary>
/// Resposta com informação de um item de lista.
/// </summary>
public sealed class ListItemResponse
{
    /// <summary>
    /// Identificador do item.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador da lista.
    /// </summary>
    public Guid ListId { get; set; }

    /// <summary>
    /// Nome do item.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Indica se o item está concluído.
    /// </summary>
    public bool IsCompleted { get; set; }

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

    /// <summary>
    /// Data/hora de conclusão (UTC), se concluído.
    /// </summary>
    public DateTime? CompletedAtUtc { get; set; }

    /// <summary>
    /// Identificador do utilizador que concluiu o item, se aplicável.
    /// </summary>
    public Guid? CompletedByUserId { get; set; }
}
