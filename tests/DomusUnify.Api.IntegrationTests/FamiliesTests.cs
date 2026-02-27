using System.Net;
using DomusUnify.Api.IntegrationTests.Helpers;

namespace DomusUnify.Api.IntegrationTests;

public sealed class FamiliesTests : IClassFixture<DomusUnifyApiFactory>
{
    private readonly DomusUnifyApiFactory _factory;

    public FamiliesTests(DomusUnifyApiFactory factory) => _factory = factory;

    [Fact]
    public async Task GetMyFamilies_RequiresAuthentication()
    {
        var http = _factory.CreateHttpsClient();

        var response = await http.GetAsync("/api/v1/families/my");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateFamily_SetsCurrentFamily_And_IsListed()
    {
        var api = new ApiTestClient(_factory.CreateHttpsClient());

        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");
        var email = $"owner-{Guid.NewGuid():N}@example.com";

        var auth = await api.RegisterAsync("Family Owner", email, password);
        api.SetBearerToken(auth.AccessToken);

        var before = await api.GetMyFamiliesAsync();
        Assert.Empty(before);

        var created = await api.CreateFamilyAsync($"Family {Guid.NewGuid():N}");
        Assert.NotEqual(Guid.Empty, created.Id);

        var current = await api.GetMyFamilyAsync();
        Assert.Equal(created.Id, current.Id);

        var after = await api.GetMyFamiliesAsync();
        Assert.Single(after);
        Assert.Equal(created.Id, after[0].Id);
    }
}

