namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define o padrão para um orçamento semi-mensal.
/// </summary>
public enum BudgetSemiMonthlyPattern
{
    /// <summary>
    /// Do dia 1 ao dia 15.
    /// </summary>
    FirstAndFifteenth = 0,

    /// <summary>
    /// Do dia 15 ao último dia do mês.
    /// </summary>
    FifteenthAndLastDay = 1
}
