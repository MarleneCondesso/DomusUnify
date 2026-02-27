using System.Net;
using System.Net.Http.Json;
using DomusUnify.Api.IntegrationTests.Helpers;

namespace DomusUnify.Api.IntegrationTests;

public sealed class AuthTests : IClassFixture<DomusUnifyApiFactory>
{
    private readonly DomusUnifyApiFactory _factory;

    public AuthTests(DomusUnifyApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Register_Then_Login_ReturnsTokens()
    {
        var api = new ApiTestClient(_factory.CreateHttpsClient());

        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");
        var email = $"user-{Guid.NewGuid():N}@example.com";

        var reg = await api.RegisterAsync("Test User", email, password);
        var login = await api.LoginAsync(email, password);

        Assert.False(string.IsNullOrWhiteSpace(reg.AccessToken));
        Assert.False(string.IsNullOrWhiteSpace(login.AccessToken));
    }

    [Fact]
    public async Task GoogleOAuth_Login_ReturnsToken()
    {
        var api = new ApiTestClient(_factory.CreateHttpsClient());

        var idToken = TestEnv.Get("DOMUSUNIFY_TEST_GOOGLE_ID_TOKEN", "test.test.test");
        var auth = await api.LoginWithGoogleAsync(idToken);

        Assert.False(string.IsNullOrWhiteSpace(auth.AccessToken));
    }

    [Fact]
    public async Task GoogleOAuth_EmptyToken_ReturnsUnauthorized()
    {
        var http = _factory.CreateHttpsClient();

        var response = await http.PostAsJsonAsync("/api/v1/auth/oauth/google", new { idToken = "" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
