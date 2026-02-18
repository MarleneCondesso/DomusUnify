using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

public sealed class FinanceTransaction : BaseEntity
{
    public Guid BudgetId { get; set; }
    public Budget Budget { get; set; } = null!;

    public decimal Amount { get; set; }
    public string Title { get; set; } = null!;
    public FinanceTransactionType Type { get; set; } = FinanceTransactionType.Expense;

    public Guid CategoryId { get; set; }
    public FinanceCategory Category { get; set; } = null!;

    public Guid AccountId { get; set; }
    public FinanceAccount Account { get; set; } = null!;

    public Guid PaidByUserId { get; set; }
    public User PaidByUser { get; set; } = null!;

    public DateOnly Date { get; set; }
    public bool IsPaid { get; set; } = false;
    public DateTime? PaidAtUtc { get; set; }

    // Repetição
    public TransactionRepeatType RepeatType { get; set; } = TransactionRepeatType.None;
    public int? RepeatInterval { get; set; }
    public TransactionRepeatUnit? RepeatUnit { get; set; }

    // Lembrete
    public TransactionReminderType ReminderType { get; set; } = TransactionReminderType.None;
    public int? ReminderValue { get; set; } // usado quando ReminderType == Custom
    public TransactionReminderUnit? ReminderUnit { get; set; } // usado quando ReminderType == Custom

    public string? Note { get; set; }

    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
}

