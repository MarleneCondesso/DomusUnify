using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma transação financeira associada a um orçamento.
/// </summary>
public sealed class FinanceTransaction : BaseEntity
{
    /// <summary>
    /// Identificador do orçamento.
    /// </summary>
    public Guid BudgetId { get; set; }

    /// <summary>
    /// Orçamento associado.
    /// </summary>
    public Budget Budget { get; set; } = null!;

    /// <summary>
    /// Valor monetário da transação.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Título/descrição curta da transação.
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Tipo da transação (despesa ou rendimento).
    /// </summary>
    public FinanceTransactionType Type { get; set; } = FinanceTransactionType.Expense;

    /// <summary>
    /// Identificador da categoria.
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Categoria associada.
    /// </summary>
    public FinanceCategory Category { get; set; } = null!;

    /// <summary>
    /// Identificador da conta.
    /// </summary>
    public Guid AccountId { get; set; }

    /// <summary>
    /// Conta associada.
    /// </summary>
    public FinanceAccount Account { get; set; } = null!;

    /// <summary>
    /// Identificador do membro que pagou/recebeu.
    /// </summary>
    public Guid PaidByUserId { get; set; }

    /// <summary>
    /// Utilizador que pagou/recebeu.
    /// </summary>
    public User PaidByUser { get; set; } = null!;

    /// <summary>
    /// Data da transação.
    /// </summary>
    public DateOnly Date { get; set; }

    /// <summary>
    /// Indica se a transação está marcada como paga.
    /// </summary>
    public bool IsPaid { get; set; } = false;

    /// <summary>
    /// Data/hora (UTC) em que a transação foi marcada como paga, se aplicável.
    /// </summary>
    public DateTime? PaidAtUtc { get; set; }

    /// <summary>
    /// Tipo de repetição da transação.
    /// </summary>
    public TransactionRepeatType RepeatType { get; set; } = TransactionRepeatType.None;

    /// <summary>
    /// Intervalo de repetição quando aplicável.
    /// </summary>
    public int? RepeatInterval { get; set; }

    /// <summary>
    /// Unidade de repetição quando aplicável.
    /// </summary>
    public TransactionRepeatUnit? RepeatUnit { get; set; }

    /// <summary>
    /// Tipo de lembrete da transação.
    /// </summary>
    public TransactionReminderType ReminderType { get; set; } = TransactionReminderType.None;

    /// <summary>
    /// Valor do lembrete quando <see cref="ReminderType"/> é <see cref="TransactionReminderType.Custom"/>.
    /// </summary>
    public int? ReminderValue { get; set; }

    /// <summary>
    /// Unidade do lembrete quando <see cref="ReminderType"/> é <see cref="TransactionReminderType.Custom"/>.
    /// </summary>
    public TransactionReminderUnit? ReminderUnit { get; set; }

    /// <summary>
    /// Nota adicional (opcional).
    /// </summary>
    public string? Note { get; set; }

    /// <summary>
    /// Identificador do utilizador que criou a transação.
    /// </summary>
    public Guid CreatedByUserId { get; set; }

    /// <summary>
    /// Utilizador que criou a transação.
    /// </summary>
    public User CreatedByUser { get; set; } = null!;
}
