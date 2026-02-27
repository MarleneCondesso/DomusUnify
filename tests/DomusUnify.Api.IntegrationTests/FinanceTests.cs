using DomusUnify.Api.IntegrationTests.Helpers;

namespace DomusUnify.Api.IntegrationTests;

public sealed class FinanceTests : IClassFixture<DomusUnifyApiFactory>
{
    private readonly DomusUnifyApiFactory _factory;

    public FinanceTests(DomusUnifyApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Create_And_List_Transaction()
    {
        var api = new ApiTestClient(_factory.CreateHttpsClient());

        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");
        var email = $"fin-user-{Guid.NewGuid():N}@example.com";

        var auth = await api.RegisterAsync("Finance User", email, password);
        api.SetBearerToken(auth.AccessToken);

        await api.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var budget = await api.CreateBudgetAsync($"Budget {Guid.NewGuid():N}", startDate: DateOnly.FromDateTime(DateTime.UtcNow));

        var category = await api.CreateFinanceCategoryAsync("Expense", $"Food {Guid.NewGuid():N}", iconKey: "restaurant", sortOrder: 10);
        var account = await api.CreateFinanceAccountAsync("Checking", $"Bank {Guid.NewGuid():N}", iconKey: "bank-card", sortOrder: 10);

        var members = await api.GetCurrentFamilyMembersAsync();
        Assert.NotEmpty(members);

        var paidByUserId = members[0].UserId;

        var tx = await api.CreateFinanceTransactionAsync(
            budgetId: budget.Id,
            amount: 4.5m,
            title: "Coffee",
            type: "Expense",
            categoryId: category.Id,
            accountId: account.Id,
            paidByUserId: paidByUserId,
            date: DateOnly.FromDateTime(DateTime.UtcNow),
            isPaid: true);

        Assert.NotEqual(Guid.Empty, tx.Id);
        Assert.Equal(budget.Id, tx.BudgetId);
        Assert.True(tx.IsPaid);

        var list = await api.GetFinanceTransactionsAsync(budget.Id);
        Assert.Contains(list, x => x.Id == tx.Id);
    }
}

