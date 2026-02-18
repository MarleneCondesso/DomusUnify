namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define o tipo de lembrete para uma transação.
/// </summary>
public enum TransactionReminderType
{
    /// <summary>
    /// Sem lembrete.
    /// </summary>
    None = 0,

    /// <summary>
    /// No próprio dia às 09:00.
    /// </summary>
    SameDayAt0900 = 1,

    /// <summary>
    /// No dia anterior às 18:00.
    /// </summary>
    PreviousDayAt1800 = 2,

    /// <summary>
    /// 1 dia antes às 09:00.
    /// </summary>
    OneDayBeforeAt0900 = 3,

    /// <summary>
    /// 2 dias antes às 09:00.
    /// </summary>
    TwoDaysBeforeAt0900 = 4,

    /// <summary>
    /// Lembrete personalizado (valor + unidade).
    /// </summary>
    Custom = 5
}
