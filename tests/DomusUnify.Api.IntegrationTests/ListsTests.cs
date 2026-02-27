using DomusUnify.Api.IntegrationTests.Helpers;

namespace DomusUnify.Api.IntegrationTests;

public sealed class ListsTests : IClassFixture<DomusUnifyApiFactory>
{
    private readonly DomusUnifyApiFactory _factory;

    public ListsTests(DomusUnifyApiFactory factory) => _factory = factory;

    [Fact]
    public async Task CreateList_Then_AddItem_Then_CompleteItem()
    {
        var api = new ApiTestClient(_factory.CreateHttpsClient());

        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");
        var email = $"list-user-{Guid.NewGuid():N}@example.com";

        var auth = await api.RegisterAsync("Lists User", email, password);
        api.SetBearerToken(auth.AccessToken);

        // Needs a current family for list endpoints.
        await api.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var listsBefore = await api.GetListsAsync();
        Assert.Empty(listsBefore);

        var list = await api.CreateListAsync($"Groceries {Guid.NewGuid():N}", type: "Shopping", colorHex: "#00AAFF");
        Assert.NotEqual(Guid.Empty, list.Id);

        var listsAfter = await api.GetListsAsync();
        Assert.Single(listsAfter);

        var item = await api.AddListItemAsync(list.Id, "Milk");
        Assert.Equal(list.Id, item.ListId);
        Assert.False(item.IsCompleted);

        var items = await api.GetListItemsAsync(list.Id);
        Assert.Single(items);

        await api.UpdateListItemAsync(item.Id, isCompleted: true);

        var itemsAfter = await api.GetListItemsAsync(list.Id);
        Assert.Single(itemsAfter);
        Assert.True(itemsAfter[0].IsCompleted);

        var listsCounts = await api.GetListsAsync();
        Assert.Single(listsCounts);
        Assert.Equal(1, listsCounts[0].ItemsCount);
        Assert.Equal(1, listsCounts[0].CompletedCount);
    }
}

