namespace DomusUnify.Domain.Enums;

public enum TransactionReminderType
{
    None = 0,
    SameDayAt0900 = 1,
    PreviousDayAt1800 = 2,
    OneDayBeforeAt0900 = 3,
    TwoDaysBeforeAt0900 = 4,
    Custom = 5
}

