using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.FinanceTransactions.Models;

public sealed record FinanceTransactionModel(
    Guid Id,
    Guid BudgetId,
    decimal Amount,
    string Title,
    string Type,
    Guid CategoryId,
    string CategoryName,
    string CategoryIconKey,
    Guid AccountId,
    string AccountName,
    string AccountIconKey,
    Guid PaidByUserId,
    string PaidByUserName,
    DateOnly Date,
    bool IsPaid,
    DateTime? PaidAtUtc,
    TransactionRepeatType RepeatType,
    int? RepeatInterval,
    TransactionRepeatUnit? RepeatUnit,
    TransactionReminderType ReminderType,
    int? ReminderValue,
    TransactionReminderUnit? ReminderUnit,
    string? Note
);

public sealed record FinanceTransactionCreateInput(
    decimal Amount,
    string Title,
    string Type,
    Guid CategoryId,
    Guid AccountId,
    Guid PaidByUserId,
    DateOnly? Date,
    bool IsPaid,
    TransactionRepeatType RepeatType,
    int? RepeatInterval,
    TransactionRepeatUnit? RepeatUnit,
    TransactionReminderType ReminderType,
    int? ReminderValue,
    TransactionReminderUnit? ReminderUnit,
    string? Note
);

public sealed record FinanceTransactionUpdateInput(
    decimal? Amount,
    string? Title,
    string? Type,
    Guid? CategoryId,
    Guid? AccountId,
    Guid? PaidByUserId,
    DateOnly? Date,
    bool? IsPaid,
    TransactionRepeatType? RepeatType,
    int? RepeatInterval,
    TransactionRepeatUnit? RepeatUnit,
    TransactionReminderType? ReminderType,
    int? ReminderValue,
    TransactionReminderUnit? ReminderUnit,
    string? Note,
    bool NoteChangeRequested
);

public sealed record BudgetTotalsModel(
    DateOnly Today,
    DateOnly PeriodStart,
    DateOnly PeriodEnd,
    decimal IncomeThisPeriod,
    decimal ExpensesThisPeriod,
    decimal BalanceThisPeriod,
    decimal BalanceToday,
    decimal TotalExpenses
);

public sealed record CategorySummaryModel(
    Guid CategoryId,
    string CategoryName,
    string CategoryIconKey,
    decimal Total,
    decimal Percentage
);

public sealed record MemberSummaryModel(
    Guid UserId,
    string Name,
    decimal Total,
    decimal Percentage
);

public sealed record AccountSummaryModel(
    Guid AccountId,
    string Name,
    decimal Total,
    decimal Percentage
);

public sealed record CsvExportModel(
    string FileName,
    string ContentType,
    byte[] Content
);

