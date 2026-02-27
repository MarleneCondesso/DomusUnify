using DomusUnify.Api.IntegrationTests.Helpers;

namespace DomusUnify.Api.IntegrationTests;

public sealed class ItemCategoriesTests : IClassFixture<DomusUnifyApiFactory>
{
    private readonly DomusUnifyApiFactory _factory;

    public ItemCategoriesTests(DomusUnifyApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Create_Update_Delete_ItemCategory()
    {
        var api = new ApiTestClient(_factory.CreateHttpsClient());

        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");
        var email = $"cat-user-{Guid.NewGuid():N}@example.com";

        var auth = await api.RegisterAsync("Categories User", email, password);
        api.SetBearerToken(auth.AccessToken);

        await api.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var before = await api.GetItemCategoriesAsync();
        Assert.Empty(before);

        var created = await api.CreateItemCategoryAsync($"Groceries {Guid.NewGuid():N}", iconKey: "shopping-cart", sortOrder: 1);
        Assert.NotEqual(Guid.Empty, created.Id);

        var afterCreate = await api.GetItemCategoriesAsync();
        Assert.Single(afterCreate);

        var updated = await api.UpdateItemCategoryAsync(created.Id, $"Groceries Updated {Guid.NewGuid():N}", iconKey: "tag", sortOrder: 2);
        Assert.Equal(created.Id, updated.Id);
        Assert.Equal(2, updated.SortOrder);

        await api.DeleteItemCategoryAsync(created.Id);

        var afterDelete = await api.GetItemCategoriesAsync();
        Assert.Empty(afterDelete);
    }
}

