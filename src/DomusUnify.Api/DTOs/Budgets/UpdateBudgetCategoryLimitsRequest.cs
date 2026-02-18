namespace DomusUnify.Api.DTOs.Budgets;

/// <summary>
/// Pedido para atualizar os limites por categoria (despesas) de um orçamento.
/// </summary>
public sealed class UpdateBudgetCategoryLimitsRequest
{
    /// <summary>
    /// Lista de limites a aplicar.
    /// </summary>
    public List<BudgetCategoryLimitRequest> Limits { get; set; } = new();
}
