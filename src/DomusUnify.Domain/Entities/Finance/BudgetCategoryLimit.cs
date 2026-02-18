using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa um limite de despesa por categoria num orçamento.
/// </summary>
public sealed class BudgetCategoryLimit : BaseEntity
{
    /// <summary>
    /// Identificador do orçamento.
    /// </summary>
    public Guid BudgetId { get; set; }

    /// <summary>
    /// Orçamento associado.
    /// </summary>
    public Budget Budget { get; set; } = null!;

    /// <summary>
    /// Identificador da categoria financeira (despesa).
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Categoria financeira associada.
    /// </summary>
    public FinanceCategory Category { get; set; } = null!;

    /// <summary>
    /// Valor máximo definido para a categoria.
    /// </summary>
    public decimal Amount { get; set; }
}
