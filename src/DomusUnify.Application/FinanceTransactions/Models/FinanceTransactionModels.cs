using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.FinanceTransactions.Models;

/// <summary>
/// Modelo de transação financeira.
/// </summary>
/// <param name="Id">Identificador da transação.</param>
/// <param name="BudgetId">Identificador do orçamento.</param>
/// <param name="Amount">Valor monetário da transação.</param>
/// <param name="Title">Título/descrição curta.</param>
/// <param name="Type">Tipo da transação (<c>Expense</c> ou <c>Income</c>).</param>
/// <param name="CategoryId">Identificador da categoria.</param>
/// <param name="CategoryName">Nome da categoria.</param>
/// <param name="CategoryIconKey">Chave do ícone da categoria.</param>
/// <param name="AccountId">Identificador da conta.</param>
/// <param name="AccountName">Nome da conta.</param>
/// <param name="AccountIconKey">Chave do ícone da conta.</param>
/// <param name="PaidByUserId">Identificador do membro que pagou/recebeu.</param>
/// <param name="PaidByUserName">Nome do membro que pagou/recebeu.</param>
/// <param name="Date">Data da transação.</param>
/// <param name="IsPaid">Indica se a transação está marcada como paga.</param>
/// <param name="PaidAtUtc">Data/hora (UTC) em que foi marcada como paga, se aplicável.</param>
/// <param name="RepeatType">Tipo de repetição.</param>
/// <param name="RepeatInterval">Intervalo de repetição quando aplicável.</param>
/// <param name="RepeatUnit">Unidade de repetição quando aplicável.</param>
/// <param name="ReminderType">Tipo de lembrete.</param>
/// <param name="ReminderValue">Valor do lembrete quando aplicável.</param>
/// <param name="ReminderUnit">Unidade do lembrete quando aplicável.</param>
/// <param name="Note">Nota adicional (opcional).</param>
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

/// <summary>
/// Dados de entrada para criação de uma transação financeira.
/// </summary>
/// <param name="Amount">Valor monetário da transação.</param>
/// <param name="Title">Título/descrição curta.</param>
/// <param name="Type">Tipo da transação (<c>Expense</c> ou <c>Income</c>).</param>
/// <param name="CategoryId">Categoria.</param>
/// <param name="AccountId">Conta.</param>
/// <param name="PaidByUserId">Membro que pagou/recebeu.</param>
/// <param name="Date">Data (opcional).</param>
/// <param name="IsPaid">Indica se fica marcada como paga.</param>
/// <param name="RepeatType">Tipo de repetição.</param>
/// <param name="RepeatInterval">Intervalo de repetição quando aplicável.</param>
/// <param name="RepeatUnit">Unidade de repetição quando aplicável.</param>
/// <param name="ReminderType">Tipo de lembrete.</param>
/// <param name="ReminderValue">Valor do lembrete quando aplicável.</param>
/// <param name="ReminderUnit">Unidade do lembrete quando aplicável.</param>
/// <param name="Note">Nota adicional (opcional).</param>
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

/// <summary>
/// Dados de entrada para atualização (parcial) de uma transação financeira.
/// </summary>
/// <param name="Amount">Novo valor (opcional).</param>
/// <param name="Title">Novo título (opcional).</param>
/// <param name="Type">Novo tipo (<c>Expense</c>/<c>Income</c>) (opcional).</param>
/// <param name="CategoryId">Nova categoria (opcional).</param>
/// <param name="AccountId">Nova conta (opcional).</param>
/// <param name="PaidByUserId">Novo membro que pagou/recebeu (opcional).</param>
/// <param name="Date">Nova data (opcional).</param>
/// <param name="IsPaid">Novo estado pago (opcional).</param>
/// <param name="RepeatType">Novo tipo de repetição (opcional).</param>
/// <param name="RepeatInterval">Novo intervalo de repetição (opcional).</param>
/// <param name="RepeatUnit">Nova unidade de repetição (opcional).</param>
/// <param name="ReminderType">Novo tipo de lembrete (opcional).</param>
/// <param name="ReminderValue">Novo valor de lembrete (opcional).</param>
/// <param name="ReminderUnit">Nova unidade de lembrete (opcional).</param>
/// <param name="Note">Nova nota (opcional).</param>
/// <param name="NoteChangeRequested">Indica explicitamente que a nota deve ser alterada/limpa.</param>
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

/// <summary>
/// Totais e saldos calculados para um orçamento num período.
/// </summary>
/// <param name="Today">Data de referência (normalmente hoje).</param>
/// <param name="PeriodStart">Início do período.</param>
/// <param name="PeriodEnd">Fim do período.</param>
/// <param name="IncomeThisPeriod">Rendimentos do período.</param>
/// <param name="ExpensesThisPeriod">Despesas do período.</param>
/// <param name="BalanceThisPeriod">Saldo do período.</param>
/// <param name="BalanceToday">Saldo do dia.</param>
/// <param name="TotalExpenses">Despesas totais acumuladas.</param>
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

/// <summary>
/// Snapshot de despesas para o widget de orçamento.
/// </summary>
/// <param name="Today">Dia de referência.</param>
/// <param name="MonthStart">Início do mês.</param>
/// <param name="MonthEnd">Fim do mês.</param>
/// <param name="MonthExpenses">Despesas totais do mês.</param>
/// <param name="TodayExpenses">Despesas totais do dia.</param>
public sealed record BudgetExpenseWidgetModel(
    DateOnly Today,
    DateOnly MonthStart,
    DateOnly MonthEnd,
    decimal MonthExpenses,
    decimal TodayExpenses
);

/// <summary>
/// Resumo agregado por categoria.
/// </summary>
/// <param name="CategoryId">Identificador da categoria.</param>
/// <param name="CategoryName">Nome da categoria.</param>
/// <param name="CategoryIconKey">Chave do ícone da categoria.</param>
/// <param name="Total">Total agregado.</param>
/// <param name="Percentage">Percentagem do total (0–100).</param>
public sealed record CategorySummaryModel(
    Guid CategoryId,
    string CategoryName,
    string CategoryIconKey,
    decimal Total,
    decimal Percentage
);

/// <summary>
/// Resumo agregado por membro (pago por).
/// </summary>
/// <param name="UserId">Identificador do utilizador.</param>
/// <param name="Name">Nome do utilizador.</param>
/// <param name="Total">Total agregado.</param>
/// <param name="Percentage">Percentagem do total (0–100).</param>
public sealed record MemberSummaryModel(
    Guid UserId,
    string Name,
    decimal Total,
    decimal Percentage
);

/// <summary>
/// Resumo agregado por conta.
/// </summary>
/// <param name="AccountId">Identificador da conta.</param>
/// <param name="Name">Nome da conta.</param>
/// <param name="Total">Total agregado.</param>
/// <param name="Percentage">Percentagem do total (0–100).</param>
public sealed record AccountSummaryModel(
    Guid AccountId,
    string Name,
    decimal Total,
    decimal Percentage
);

/// <summary>
/// Modelo com os dados do ficheiro exportado.
/// </summary>
/// <param name="FileName">Nome do ficheiro.</param>
/// <param name="ContentType">Tipo MIME (ex.: <c>text/csv</c>).</param>
/// <param name="Content">Conteúdo binário do ficheiro.</param>
public sealed record CsvExportModel(
    string FileName,
    string ContentType,
    byte[] Content
);
