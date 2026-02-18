namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Pedido para criar uma nova transação financeira.
/// </summary>
public sealed class CreateFinanceTransactionRequest
{
    /// <summary>
    /// Valor monetário da transação.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Título/descrição curta da transação.
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Tipo de transação (<c>Expense</c> ou <c>Income</c>).
    /// </summary>
    public string Type { get; set; } = "Expense";

    /// <summary>
    /// Identificador da categoria financeira.
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Identificador da conta associada.
    /// </summary>
    public Guid AccountId { get; set; }

    /// <summary>
    /// Identificador do membro que pagou/recebeu a transação.
    /// </summary>
    public Guid PaidByUserId { get; set; }

    /// <summary>
    /// Data da transação (opcional). Quando omitida, pode ser assumida a data atual.
    /// </summary>
    public DateOnly? Date { get; set; }

    /// <summary>
    /// Indica se a transação está marcada como paga.
    /// </summary>
    public bool IsPaid { get; set; } = false;

    /// <summary>
    /// Tipo de repetição (por omissão <c>None</c>).
    /// </summary>
    public string RepeatType { get; set; } = "None"; // None | Daily | Weekdays | Weekly | BiWeekly | Monthly | Yearly | Custom

    /// <summary>
    /// Intervalo de repetição quando <see cref="RepeatType"/> é <c>Custom</c>.
    /// </summary>
    public int? RepeatInterval { get; set; }

    /// <summary>
    /// Unidade de repetição quando <see cref="RepeatType"/> é <c>Custom</c>.
    /// </summary>
    public string? RepeatUnit { get; set; } // Days | Weeks | Months | Years (apenas quando Custom)

    /// <summary>
    /// Tipo de lembrete (por omissão <c>None</c>).
    /// </summary>
    public string ReminderType { get; set; } = "None"; // None | SameDayAt0900 | PreviousDayAt1800 | OneDayBeforeAt0900 | TwoDaysBeforeAt0900 | Custom

    /// <summary>
    /// Valor do lembrete quando <see cref="ReminderType"/> é <c>Custom</c>.
    /// </summary>
    public int? ReminderValue { get; set; }

    /// <summary>
    /// Unidade do lembrete quando <see cref="ReminderType"/> é <c>Custom</c>.
    /// </summary>
    public string? ReminderUnit { get; set; } // Minutes | Hours | Days (apenas quando Custom)

    /// <summary>
    /// Nota adicional (opcional).
    /// </summary>
    public string? Note { get; set; }
}
