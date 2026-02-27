using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma categoria de itens de listas na família.
/// </summary>
public class ItemCategory : BaseEntity
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
    /// Nome da categoria.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Tipo de lista ao qual esta categoria pertence.
    /// </summary>
    public ListType Type { get; set; } = ListType.Custom;

    /// <summary>
    /// Chave do ícone da categoria.
    /// </summary>
    public string IconKey { get; set; } = "tag";

    /// <summary>
    /// Ordem de apresentação.
    /// </summary>
    public int SortOrder { get; set; } = 0;

    /// <summary>
    /// Itens associados a esta categoria.
    /// </summary>
    public ICollection<ListItem> Items { get; set; } = new List<ListItem>();
}
