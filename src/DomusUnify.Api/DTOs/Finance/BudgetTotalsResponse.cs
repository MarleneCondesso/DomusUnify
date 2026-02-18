namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Resposta com totais e saldos de um orçamento para um período.
/// </summary>
public sealed class BudgetTotalsResponse
{
    /// <summary>
    /// Data de hoje (UTC) usada no cálculo.
    /// </summary>
    public DateOnly Today { get; set; }

    /// <summary>
    /// Data de início do período calculado.
    /// </summary>
    public DateOnly PeriodStart { get; set; }

    /// <summary>
    /// Data de fim do período calculado.
    /// </summary>
    public DateOnly PeriodEnd { get; set; }

    /// <summary>
    /// Rendimentos do período.
    /// </summary>
    public decimal IncomeThisPeriod { get; set; }

    /// <summary>
    /// Despesas do período.
    /// </summary>
    public decimal ExpensesThisPeriod { get; set; }

    /// <summary>
    /// Saldo do período (rendimentos - despesas).
    /// </summary>
    public decimal BalanceThisPeriod { get; set; }

    /// <summary>
    /// Saldo do dia (hoje).
    /// </summary>
    public decimal BalanceToday { get; set; }

    /// <summary>
    /// Despesas totais acumuladas (sem limitar ao período).
    /// </summary>
    public decimal TotalExpenses { get; set; }
}
