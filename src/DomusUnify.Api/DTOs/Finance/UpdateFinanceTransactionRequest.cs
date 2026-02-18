namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Pedido para atualizar uma transação financeira.
/// </summary>
public sealed class UpdateFinanceTransactionRequest
{
    /// <summary>
    /// Novo valor monetário (opcional).
    /// </summary>
    public decimal? Amount { get; set; }

    /// <summary>
    /// Novo título/descrição (opcional).
    /// </summary>
    public string? Title { get; set; }

    /// <summary>
    /// Novo tipo (<c>Expense</c> ou <c>Income</c>) (opcional).
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// Nova categoria (opcional).
    /// </summary>
    public Guid? CategoryId { get; set; }

    /// <summary>
    /// Nova conta (opcional).
    /// </summary>
    public Guid? AccountId { get; set; }

    /// <summary>
    /// Novo membro que pagou/recebeu (opcional).
    /// </summary>
    public Guid? PaidByUserId { get; set; }

    /// <summary>
    /// Nova data (opcional).
    /// </summary>
    public DateOnly? Date { get; set; }

    /// <summary>
    /// Indica se a transação passa a estar marcada como paga (opcional).
    /// </summary>
    public bool? IsPaid { get; set; }

    /// <summary>
    /// Novo tipo de repetição (opcional).
    /// </summary>
    public string? RepeatType { get; set; }

    /// <summary>
    /// Novo intervalo de repetição (opcional).
    /// </summary>
    public int? RepeatInterval { get; set; }

    /// <summary>
    /// Nova unidade de repetição (opcional).
    /// </summary>
    public string? RepeatUnit { get; set; }

    /// <summary>
    /// Novo tipo de lembrete (opcional).
    /// </summary>
    public string? ReminderType { get; set; }

    /// <summary>
    /// Novo valor do lembrete (opcional).
    /// </summary>
    public int? ReminderValue { get; set; }

    /// <summary>
    /// Nova unidade do lembrete (opcional).
    /// </summary>
    public string? ReminderUnit { get; set; }

    /// <summary>
    /// Nova nota (opcional).
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// Indica explicitamente que a nota deve ser alterada/limpa, mesmo que o valor seja <see langword="null"/>.
    /// </summary>
    public bool NoteChangeRequested { get; set; } = false;
}
