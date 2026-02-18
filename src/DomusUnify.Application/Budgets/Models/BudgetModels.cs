using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.Budgets.Models;

/// <summary>
/// Modelo com informação resumida de um orçamento.
/// </summary>
/// <param name="Id">Identificador do orçamento.</param>
/// <param name="Name">Nome do orçamento.</param>
/// <param name="IconKey">Chave do ícone do orçamento.</param>
/// <param name="Type">Tipo do orçamento (<c>Recurring</c> ou <c>OneTime</c>).</param>
/// <param name="CurrencyCode">Código ISO da moeda (ex.: <c>EUR</c>).</param>
/// <param name="VisibilityMode">Modo de visibilidade do orçamento.</param>
public sealed record BudgetSummaryModel(
    Guid Id,
    string Name,
    string IconKey,
    string Type,
    string CurrencyCode,
    string VisibilityMode
);

/// <summary>
/// Modelo com o detalhe completo de um orçamento.
/// </summary>
/// <param name="Id">Identificador do orçamento.</param>
/// <param name="FamilyId">Identificador da família proprietária do orçamento.</param>
/// <param name="OwnerUserId">Identificador do utilizador proprietário (criador).</param>
/// <param name="Name">Nome do orçamento.</param>
/// <param name="IconKey">Chave do ícone do orçamento.</param>
/// <param name="Type">Tipo do orçamento (<c>Recurring</c> ou <c>OneTime</c>).</param>
/// <param name="PeriodType">Período do orçamento recorrente (opcional).</param>
/// <param name="StartDate">Data de início (para orçamento único) ou referência de início (para recorrente).</param>
/// <param name="EndDate">Data de fim (apenas para orçamento único), opcional.</param>
/// <param name="SemiMonthlyPattern">Padrão semi-mensal quando aplicável (opcional).</param>
/// <param name="SpendingLimit">Limite global de gastos (opcional).</param>
/// <param name="CurrencyCode">Código ISO da moeda (ex.: <c>EUR</c>).</param>
/// <param name="VisibilityMode">Modo de visibilidade do orçamento.</param>
/// <param name="MainIndicator">Indicador principal a apresentar no topo.</param>
/// <param name="OnlyPaidInTotals">Quando <see langword="true"/>, apenas transações pagas entram nos totais.</param>
/// <param name="TransactionOrder">Ordenação da lista de transações.</param>
/// <param name="UpcomingDisplayMode">Modo de apresentação das próximas transações.</param>
/// <param name="AllowedUserIds">Lista de utilizadores com acesso quando a visibilidade é por membros específicos.</param>
public sealed record BudgetDetailModel(
    Guid Id,
    Guid FamilyId,
    Guid OwnerUserId,
    string Name,
    string IconKey,
    string Type,
    string? PeriodType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? SemiMonthlyPattern,
    decimal? SpendingLimit,
    string CurrencyCode,
    string VisibilityMode,
    BudgetMainIndicator MainIndicator,
    bool OnlyPaidInTotals,
    BudgetTransactionOrder TransactionOrder,
    BudgetUpcomingDisplayMode UpcomingDisplayMode,
    IReadOnlyList<Guid> AllowedUserIds
);

/// <summary>
/// Modelo com informação de um membro associado ao orçamento.
/// </summary>
/// <param name="UserId">Identificador do utilizador.</param>
/// <param name="Name">Nome do utilizador.</param>
/// <param name="Role">Papel do utilizador no contexto da família.</param>
public sealed record BudgetMemberModel(
    Guid UserId,
    string Name,
    string Role
);

/// <summary>
/// Modelo com o limite de despesa definido para uma categoria num orçamento.
/// </summary>
/// <param name="Id">Identificador do limite.</param>
/// <param name="CategoryId">Identificador da categoria.</param>
/// <param name="CategoryName">Nome da categoria.</param>
/// <param name="CategoryIconKey">Chave do ícone da categoria.</param>
/// <param name="CategorySortOrder">Ordem de apresentação da categoria.</param>
/// <param name="Amount">Valor máximo definido.</param>
public sealed record BudgetCategoryLimitModel(
    Guid Id,
    Guid CategoryId,
    string CategoryName,
    string CategoryIconKey,
    int CategorySortOrder,
    decimal Amount
);

/// <summary>
/// Dados de entrada para criação de um orçamento.
/// </summary>
/// <param name="Name">Nome do orçamento.</param>
/// <param name="IconKey">Chave do ícone do orçamento.</param>
/// <param name="Type">Tipo do orçamento (<c>Recurring</c> ou <c>OneTime</c>).</param>
/// <param name="PeriodType">Período do orçamento recorrente (opcional).</param>
/// <param name="StartDate">Data de início (para orçamento único) ou referência de início (para recorrente).</param>
/// <param name="EndDate">Data de fim (apenas para orçamento único), opcional.</param>
/// <param name="SemiMonthlyPattern">Padrão semi-mensal quando aplicável (opcional).</param>
/// <param name="SpendingLimit">Limite global de gastos (opcional).</param>
/// <param name="CurrencyCode">Código ISO da moeda (ex.: <c>EUR</c>).</param>
/// <param name="VisibilityMode">Modo de visibilidade do orçamento.</param>
/// <param name="AllowedUserIds">Utilizadores permitidos quando a visibilidade é por membros específicos (opcional).</param>
/// <param name="MainIndicator">Indicador principal (opcional).</param>
/// <param name="OnlyPaidInTotals">Quando <see langword="true"/>, apenas transações pagas entram nos totais (opcional).</param>
/// <param name="TransactionOrder">Ordenação da lista de transações (opcional).</param>
/// <param name="UpcomingDisplayMode">Modo de apresentação das próximas transações (opcional).</param>
/// <param name="CategoryLimits">Limites por categoria (despesas) a aplicar (opcional).</param>
public sealed record BudgetCreateInput(
    string Name,
    string IconKey,
    string Type,
    string? PeriodType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? SemiMonthlyPattern,
    decimal? SpendingLimit,
    string CurrencyCode,
    string VisibilityMode,
    IReadOnlyList<Guid>? AllowedUserIds,
    BudgetMainIndicator? MainIndicator,
    bool? OnlyPaidInTotals,
    BudgetTransactionOrder? TransactionOrder,
    BudgetUpcomingDisplayMode? UpcomingDisplayMode,
    IReadOnlyList<BudgetCategoryLimitInput>? CategoryLimits
);

/// <summary>
/// Dados de entrada para definir um limite por categoria (despesas).
/// </summary>
/// <param name="CategoryId">Identificador da categoria.</param>
/// <param name="Amount">Valor máximo permitido.</param>
public sealed record BudgetCategoryLimitInput(Guid CategoryId, decimal Amount);

/// <summary>
/// Dados de entrada para atualização de um orçamento.
/// </summary>
/// <param name="Name">Novo nome (opcional).</param>
/// <param name="IconKey">Nova chave do ícone (opcional).</param>
/// <param name="PeriodType">Novo período do orçamento recorrente (opcional).</param>
/// <param name="StartDate">Nova data de início (opcional).</param>
/// <param name="EndDate">Nova data de fim (opcional).</param>
/// <param name="SemiMonthlyPattern">Novo padrão semi-mensal (opcional).</param>
/// <param name="SpendingLimit">Novo limite global de gastos (opcional).</param>
/// <param name="SpendingLimitChangeRequested">Indica explicitamente que o limite deve ser alterado/limpo.</param>
/// <param name="CurrencyCode">Novo código ISO da moeda (opcional).</param>
/// <param name="VisibilityMode">Novo modo de visibilidade (opcional).</param>
/// <param name="AllowedUserIds">Nova lista de utilizadores permitidos (opcional).</param>
/// <param name="MainIndicator">Novo indicador principal (opcional).</param>
/// <param name="OnlyPaidInTotals">Indica se apenas transações pagas entram nos totais (opcional).</param>
/// <param name="TransactionOrder">Nova ordenação da lista de transações (opcional).</param>
/// <param name="UpcomingDisplayMode">Novo modo de apresentação das próximas transações (opcional).</param>
public sealed record BudgetUpdateInput(
    string? Name,
    string? IconKey,
    string? PeriodType,
    DateOnly? StartDate,
    DateOnly? EndDate,
    string? SemiMonthlyPattern,
    decimal? SpendingLimit,
    bool SpendingLimitChangeRequested,
    string? CurrencyCode,
    string? VisibilityMode,
    IReadOnlyList<Guid>? AllowedUserIds,
    BudgetMainIndicator? MainIndicator,
    bool? OnlyPaidInTotals,
    BudgetTransactionOrder? TransactionOrder,
    BudgetUpcomingDisplayMode? UpcomingDisplayMode
);
