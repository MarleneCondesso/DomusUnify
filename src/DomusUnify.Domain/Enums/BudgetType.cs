namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define o tipo de orçamento.
/// </summary>
public enum BudgetType
{
    /// <summary>
    /// Orçamento recorrente (com período configurável).
    /// </summary>
    Recurring = 0,

    /// <summary>
    /// Orçamento único (com intervalo de datas definido).
    /// </summary>
    OneTime = 1
}
