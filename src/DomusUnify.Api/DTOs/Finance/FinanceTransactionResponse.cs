namespace DomusUnify.Api.DTOs.Finance;

public sealed class FinanceTransactionResponse
{
    public Guid Id { get; set; }
    public Guid BudgetId { get; set; }

    public decimal Amount { get; set; }
    public string Title { get; set; } = null!;
    public string Type { get; set; } = null!;

    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string CategoryIconKey { get; set; } = null!;

    public Guid AccountId { get; set; }
    public string AccountName { get; set; } = null!;
    public string AccountIconKey { get; set; } = null!;

    public Guid PaidByUserId { get; set; }
    public string PaidByUserName { get; set; } = null!;

    public DateOnly Date { get; set; }
    public bool IsPaid { get; set; }
    public DateTime? PaidAtUtc { get; set; }

    public string RepeatType { get; set; } = null!;
    public int? RepeatInterval { get; set; }
    public string? RepeatUnit { get; set; }

    public string ReminderType { get; set; } = null!;
    public int? ReminderValue { get; set; }
    public string? ReminderUnit { get; set; }

    public string? Note { get; set; }
}

