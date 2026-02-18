namespace DomusUnify.Api.DTOs.Finance;

public sealed class CreateFinanceTransactionRequest
{
    public decimal Amount { get; set; }
    public string Title { get; set; } = null!;
    public string Type { get; set; } = "Expense";

    public Guid CategoryId { get; set; }
    public Guid AccountId { get; set; }
    public Guid PaidByUserId { get; set; }

    public DateOnly? Date { get; set; }
    public bool IsPaid { get; set; } = false;

    public string RepeatType { get; set; } = "None"; // None | Daily | Weekdays | Weekly | BiWeekly | Monthly | Yearly | Custom
    public int? RepeatInterval { get; set; }
    public string? RepeatUnit { get; set; } // Days | Weeks | Months | Years (apenas quando Custom)

    public string ReminderType { get; set; } = "None"; // None | SameDayAt0900 | PreviousDayAt1800 | OneDayBeforeAt0900 | TwoDaysBeforeAt0900 | Custom
    public int? ReminderValue { get; set; }
    public string? ReminderUnit { get; set; } // Minutes | Hours | Days (apenas quando Custom)

    public string? Note { get; set; }
}

