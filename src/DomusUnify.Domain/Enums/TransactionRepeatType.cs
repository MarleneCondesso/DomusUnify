namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define o tipo de repetição de uma transação.
/// </summary>
public enum TransactionRepeatType
{
    /// <summary>
    /// Não se repete.
    /// </summary>
    None = 0,

    /// <summary>
    /// Todos os dias.
    /// </summary>
    Daily = 1,

    /// <summary>
    /// Dias úteis (segunda a sexta).
    /// </summary>
    Weekdays = 2,

    /// <summary>
    /// Todas as semanas.
    /// </summary>
    Weekly = 3,

    /// <summary>
    /// A cada 2 semanas.
    /// </summary>
    BiWeekly = 4,

    /// <summary>
    /// Todos os meses.
    /// </summary>
    Monthly = 5,

    /// <summary>
    /// Todos os anos.
    /// </summary>
    Yearly = 6,

    /// <summary>
    /// Repetição personalizada (intervalo + unidade).
    /// </summary>
    Custom = 7
}
