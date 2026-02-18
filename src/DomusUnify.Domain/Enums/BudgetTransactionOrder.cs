namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define a ordenação da lista de transações no orçamento.
/// </summary>
public enum BudgetTransactionOrder
{
    /// <summary>
    /// Mais recentes primeiro.
    /// </summary>
    MostRecentFirst = 0,

    /// <summary>
    /// Mais antigas primeiro.
    /// </summary>
    OldestFirst = 1
}
