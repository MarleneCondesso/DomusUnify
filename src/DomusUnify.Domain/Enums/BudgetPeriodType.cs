namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define o período de um orçamento recorrente.
/// </summary>
public enum BudgetPeriodType
{
    /// <summary>
    /// Mensal.
    /// </summary>
    Monthly = 0,

    /// <summary>
    /// Semanal.
    /// </summary>
    Weekly = 1,

    /// <summary>
    /// Quinzenal (a cada 2 semanas).
    /// </summary>
    BiWeekly = 2,

    /// <summary>
    /// Semi-mensal (duas "metades" por mês, conforme padrão).
    /// </summary>
    SemiMonthly = 3,

    /// <summary>
    /// Anual.
    /// </summary>
    Yearly = 4
}
