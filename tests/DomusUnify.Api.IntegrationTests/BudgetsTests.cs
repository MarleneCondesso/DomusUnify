using DomusUnify.Api.IntegrationTests.Helpers;

namespace DomusUnify.Api.IntegrationTests;

public sealed class BudgetsTests : IClassFixture<DomusUnifyApiFactory>
{
    private readonly DomusUnifyApiFactory _factory;

    public BudgetsTests(DomusUnifyApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Create_And_Get_Budget()
    {
        var api = new ApiTestClient(_factory.CreateHttpsClient());

        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");
        var email = $"budget-user-{Guid.NewGuid():N}@example.com";

        var auth = await api.RegisterAsync("Budget User", email, password);
        api.SetBearerToken(auth.AccessToken);

        await api.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var startDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var created = await api.CreateBudgetAsync($"Budget {Guid.NewGuid():N}", startDate: startDate);

        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal("Recurring", created.Type);
        Assert.Equal("Monthly", created.PeriodType);

        var list = await api.GetBudgetsAsync();
        Assert.Contains(list, b => b.Id == created.Id);

        var byId = await api.GetBudgetByIdAsync(created.Id);
        Assert.Equal(created.Id, byId.Id);
    }
}

