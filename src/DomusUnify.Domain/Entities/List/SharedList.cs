using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma lista partilhada numa família (ex.: compras, tarefas, personalizada).
/// </summary>
public class SharedList : BaseEntity
{
    /// <summary>
    /// Identificador da família.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Cor da lista em hexadecimal (opcional).
    /// </summary>
    public string? ColorHex { get; set; }

    /// <summary>
    /// Nome da lista.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Tipo de lista.
    /// </summary>
    public ListType Type { get; set; } = ListType.Custom;

    /// <summary>
    /// Itens da lista.
    /// </summary>
    public ICollection<ListItem> Items { get; set; } = new List<ListItem>();
}
