using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

public sealed class Budget : BaseEntity
{
    public Guid FamilyId { get; set; }
    public Family Family { get; set; } = null!;

    public Guid OwnerUserId { get; set; }
    public User OwnerUser { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string IconKey { get; set; } = "wallet";

    public BudgetType Type { get; set; } = BudgetType.Recurring;

    // Recorrente
    public BudgetPeriodType? PeriodType { get; set; }
    public DateOnly? StartDate { get; set; }
    public BudgetSemiMonthlyPattern? SemiMonthlyPattern { get; set; }

    // Único
    public DateOnly? EndDate { get; set; }

    // Limites
    public decimal? SpendingLimit { get; set; }

    // Exibição
    public string CurrencyCode { get; set; } = "EUR";
    public BudgetMainIndicator MainIndicator { get; set; } = BudgetMainIndicator.Balance;
    public bool OnlyPaidInTotals { get; set; } = false;
    public BudgetTransactionOrder TransactionOrder { get; set; } = BudgetTransactionOrder.MostRecentFirst;
    public BudgetUpcomingDisplayMode UpcomingDisplayMode { get; set; } = BudgetUpcomingDisplayMode.Expanded;

    // Acesso
    public BudgetVisibilityMode VisibilityMode { get; set; } = BudgetVisibilityMode.AllMembers;
    public ICollection<BudgetUserAccess> AllowedUsers { get; set; } = new List<BudgetUserAccess>();

    // Orçamento por categoria
    public ICollection<BudgetCategoryLimit> CategoryLimits { get; set; } = new List<BudgetCategoryLimit>();

    // Transações
    public ICollection<FinanceTransaction> Transactions { get; set; } = new List<FinanceTransaction>();

    // Preferências por utilizador (notificações, etc.)
    public ICollection<BudgetUserSettings> UserSettings { get; set; } = new List<BudgetUserSettings>();
}

