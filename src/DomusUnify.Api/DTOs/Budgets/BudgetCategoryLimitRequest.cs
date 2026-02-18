namespace DomusUnify.Api.DTOs.Budgets;

/// <summary>
/// Pedido para definir/atualizar um limite de despesa por categoria num orçamento.
/// </summary>
public sealed class BudgetCategoryLimitRequest
{
    /// <summary>
    /// Identificador da categoria financeira (do tipo despesa).
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Valor máximo a gastar na categoria para o período do orçamento.
    /// </summary>
    public decimal Amount { get; set; }
}
