namespace DomusUnify.Api.DTOs.Finance;

public sealed class UpdateFinanceTransactionRequest
{
    public decimal? Amount { get; set; }
    public string? Title { get; set; }
    public string? Type { get; set; }

    public Guid? CategoryId { get; set; }
    public Guid? AccountId { get; set; }
    public Guid? PaidByUserId { get; set; }

    public DateOnly? Date { get; set; }
    public bool? IsPaid { get; set; }

    public string? RepeatType { get; set; }
    public int? RepeatInterval { get; set; }
    public string? RepeatUnit { get; set; }

    public string? ReminderType { get; set; }
    public int? ReminderValue { get; set; }
    public string? ReminderUnit { get; set; }

    public string? Note { get; set; }
    public bool NoteChangeRequested { get; set; } = false;
}

