namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define como as próximas transações são apresentadas na lista.
/// </summary>
public enum BudgetUpcomingDisplayMode
{
    /// <summary>
    /// Transações futuras exibidas individualmente.
    /// </summary>
    Expanded = 0,

    /// <summary>
    /// Transações futuras agrupadas numa única etiqueta/resumo.
    /// </summary>
    Collapsed = 1
}
