namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define o indicador principal a apresentar no topo da visão do orçamento.
/// </summary>
public enum BudgetMainIndicator
{
    /// <summary>
    /// Rendimento total do período.
    /// </summary>
    TotalIncome = 0,

    /// <summary>
    /// Despesas totais do período.
    /// </summary>
    TotalExpenses = 1,

    /// <summary>
    /// Saldo do período (rendimentos - despesas).
    /// </summary>
    Balance = 2,

    /// <summary>
    /// Saldo do dia (hoje).
    /// </summary>
    BalanceToday = 3
}
