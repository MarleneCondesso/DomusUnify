namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Resposta com informação de uma transação financeira.
/// </summary>
public sealed class FinanceTransactionResponse
{
    /// <summary>
    /// Identificador da transação.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Identificador do orçamento.
    /// </summary>
    public Guid BudgetId { get; set; }

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
    public string Type { get; set; } = null!;

    /// <summary>
    /// Identificador da categoria financeira.
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Nome da categoria.
    /// </summary>
    public string CategoryName { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da categoria.
    /// </summary>
    public string CategoryIconKey { get; set; } = null!;

    /// <summary>
    /// Identificador da conta.
    /// </summary>
    public Guid AccountId { get; set; }

    /// <summary>
    /// Nome da conta.
    /// </summary>
    public string AccountName { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da conta.
    /// </summary>
    public string AccountIconKey { get; set; } = null!;

    /// <summary>
    /// Identificador do membro que pagou/recebeu a transação.
    /// </summary>
    public Guid PaidByUserId { get; set; }

    /// <summary>
    /// Nome do membro que pagou/recebeu a transação.
    /// </summary>
    public string PaidByUserName { get; set; } = null!;

    /// <summary>
    /// Data da transação.
    /// </summary>
    public DateOnly Date { get; set; }

    /// <summary>
    /// Indica se a transação está marcada como paga.
    /// </summary>
    public bool IsPaid { get; set; }

    /// <summary>
    /// Data/hora (UTC) em que a transação foi marcada como paga, se aplicável.
    /// </summary>
    public DateTime? PaidAtUtc { get; set; }

    /// <summary>
    /// Tipo de repetição.
    /// </summary>
    public string RepeatType { get; set; } = null!;

    /// <summary>
    /// Intervalo de repetição quando aplicável.
    /// </summary>
    public int? RepeatInterval { get; set; }

    /// <summary>
    /// Unidade de repetição quando aplicável.
    /// </summary>
    public string? RepeatUnit { get; set; }

    /// <summary>
    /// Tipo de lembrete.
    /// </summary>
    public string ReminderType { get; set; } = null!;

    /// <summary>
    /// Valor do lembrete quando aplicável.
    /// </summary>
    public int? ReminderValue { get; set; }

    /// <summary>
    /// Unidade do lembrete quando aplicável.
    /// </summary>
    public string? ReminderUnit { get; set; }

    /// <summary>
    /// Nota adicional (opcional).
    /// </summary>
    public string? Note { get; set; }
}
