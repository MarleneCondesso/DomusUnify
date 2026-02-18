namespace DomusUnify.Api.DTOs.Finance;

public sealed class BudgetTotalsResponse
{
    public DateOnly Today { get; set; }
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }

    public decimal IncomeThisPeriod { get; set; }
    public decimal ExpensesThisPeriod { get; set; }
    public decimal BalanceThisPeriod { get; set; }
    public decimal BalanceToday { get; set; }

    public decimal TotalExpenses { get; set; }
}

