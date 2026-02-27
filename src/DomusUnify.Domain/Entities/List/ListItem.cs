using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa um item numa lista partilhada.
/// </summary>
public class ListItem : BaseEntity
{
    /// <summary>
    /// Identificador da lista.
    /// </summary>
    public Guid SharedListId { get; set; }

    /// <summary>
    /// Lista associada.
    /// </summary>
    public SharedList SharedList { get; set; } = null!;

    /// <summary>
    /// Nome do item.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Indica se o item está concluído.
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// Identificador do utilizador que concluiu o item, se aplicável.
    /// </summary>
    public Guid? CompletedByUserId { get; set; }

    /// <summary>
    /// Utilizador que concluiu o item, se aplicável.
    /// </summary>
    public User? CompletedByUser { get; set; }

    /// <summary>
    /// Identificador da categoria do item (opcional).
    /// </summary>
    public Guid? CategoryId { get; set; }

    /// <summary>
    /// Categoria do item (opcional).
    /// </summary>
    public ItemCategory? Category { get; set; }

    /// <summary>
    /// Identificador do utilizador a quem o item estÃ¡ atribuÃ­do (opcional).
    /// </summary>
    public Guid? AssigneeUserId { get; set; }

    /// <summary>
    /// Utilizador a quem o item estÃ¡ atribuÃ­do (opcional).
    /// </summary>
    public User? AssigneeUser { get; set; }

    /// <summary>
    /// Nota opcional associada ao item.
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// URL (ou data URL) de uma foto associada ao item (opcional).
    /// </summary>
    public string? PhotoUrl { get; set; }

    /// <summary>
    /// Data/hora de conclusão (UTC), se aplicável.
    /// </summary>
    public DateTime? CompletedAtUtc { get; set; }
}
