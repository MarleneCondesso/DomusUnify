using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma categoria financeira (despesa ou rendimento) na família.
/// </summary>
public sealed class FinanceCategory : BaseEntity
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
    /// Tipo de categoria.
    /// </summary>
    public FinanceCategoryType Type { get; set; } = FinanceCategoryType.Expense;

    /// <summary>
    /// Nome da categoria.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da categoria.
    /// </summary>
    public string IconKey { get; set; } = "tag";

    /// <summary>
    /// Ordem de apresentação.
    /// </summary>
    public int SortOrder { get; set; } = 0;
}
