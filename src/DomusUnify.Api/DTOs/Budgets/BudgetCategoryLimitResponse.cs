namespace DomusUnify.Api.DTOs.Budgets;

/// <summary>
/// Resposta com informação de um limite de despesa por categoria num orçamento.
/// </summary>
public sealed class BudgetCategoryLimitResponse
{
    /// <summary>
    /// Identificador do limite.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador da categoria financeira.
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Nome da categoria.
    /// </summary>
    public string CategoryName { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da categoria.
    /// </summary>
    public string CategoryIconKey { get; set; } = null!;

    /// <summary>
    /// Ordem de apresentação da categoria.
    /// </summary>
    public int CategorySortOrder { get; set; }

    /// <summary>
    /// Valor máximo definido para a categoria.
    /// </summary>
    public decimal Amount { get; set; }
}
