using DomusUnify.Api.IntegrationTests.Helpers;

namespace DomusUnify.Api.IntegrationTests;

public sealed class FamilyInvitesTests : IClassFixture<DomusUnifyApiFactory>
{
    private readonly DomusUnifyApiFactory _factory;

    public FamilyInvitesTests(DomusUnifyApiFactory factory) => _factory = factory;

    [Fact]
    public async Task InvitePreview_And_Join_AddsMemberToFamily()
    {
        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");

        var owner = new ApiTestClient(_factory.CreateHttpsClient());
        var ownerAuth = await owner.RegisterAsync("Owner", $"owner-{Guid.NewGuid():N}@example.com", password);
        owner.SetBearerToken(ownerAuth.AccessToken);

        var family = await owner.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var invite = await owner.CreateFamilyInviteAsync(family.Id, daysValid: 7);
        Assert.False(string.IsNullOrWhiteSpace(invite.InviteUrl));

        var token = invite.InviteUrl.Split("/invite/", StringSplitOptions.RemoveEmptyEntries).Last();
        Assert.False(string.IsNullOrWhiteSpace(token));

        var invited = new ApiTestClient(_factory.CreateHttpsClient());
        var invitedAuth = await invited.RegisterAsync("Invited", $"invited-{Guid.NewGuid():N}@example.com", password);
        invited.SetBearerToken(invitedAuth.AccessToken);

        var preview = await invited.PreviewFamilyInviteAsync(token);
        Assert.Equal(family.Id, preview.FamilyId);

        await invited.JoinFamilyInviteAsync(token);

        var families = await invited.GetMyFamiliesAsync();
        Assert.Contains(families, f => f.Id == family.Id);
    }
}

