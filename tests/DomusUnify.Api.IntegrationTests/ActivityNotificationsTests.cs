using DomusUnify.Api.IntegrationTests.Helpers;

namespace DomusUnify.Api.IntegrationTests;

public sealed class ActivityNotificationsTests : IClassFixture<DomusUnifyApiFactory>
{
    private readonly DomusUnifyApiFactory _factory;

    public ActivityNotificationsTests(DomusUnifyApiFactory factory) => _factory = factory;

    [Fact]
    public async Task PrivateList_IsNotVisibleToOtherMembers()
    {
        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");

        var ownerEmail = $"owner-{Guid.NewGuid():N}@example.com";
        var memberEmail = $"member-{Guid.NewGuid():N}@example.com";

        var owner = new ApiTestClient(_factory.CreateHttpsClient());
        var ownerAuth = await owner.RegisterAsync("Owner", ownerEmail, password);
        owner.SetBearerToken(ownerAuth.AccessToken);

        var family = await owner.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var invite = await owner.CreateFamilyInviteAsync(family.Id, daysValid: 7);
        var token = invite.InviteUrl.Split("/invite/", StringSplitOptions.RemoveEmptyEntries).Last();

        var member = new ApiTestClient(_factory.CreateHttpsClient());
        var memberAuth = await member.RegisterAsync("Member", memberEmail, password);
        member.SetBearerToken(memberAuth.AccessToken);
        await member.JoinFamilyInviteAsync(token);

        var privateList = await owner.CreateListAsync(
            name: $"Private {Guid.NewGuid():N}",
            type: "Custom",
            colorHex: "#00AAFF",
            visibilityMode: "Private");

        var listsForMember = await member.GetListsAsync();
        Assert.DoesNotContain(listsForMember, l => l.Id == privateList.Id);
    }

    [Fact]
    public async Task SpecificMembersList_IsVisibleToAllowedMember()
    {
        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");

        var ownerEmail = $"owner-{Guid.NewGuid():N}@example.com";
        var memberEmail = $"member-{Guid.NewGuid():N}@example.com";

        var owner = new ApiTestClient(_factory.CreateHttpsClient());
        var ownerAuth = await owner.RegisterAsync("Owner", ownerEmail, password);
        owner.SetBearerToken(ownerAuth.AccessToken);

        var family = await owner.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var invite = await owner.CreateFamilyInviteAsync(family.Id, daysValid: 7);
        var token = invite.InviteUrl.Split("/invite/", StringSplitOptions.RemoveEmptyEntries).Last();

        var member = new ApiTestClient(_factory.CreateHttpsClient());
        var memberAuth = await member.RegisterAsync("Member", memberEmail, password);
        member.SetBearerToken(memberAuth.AccessToken);
        await member.JoinFamilyInviteAsync(token);

        var members = await owner.GetCurrentFamilyMembersAsync();
        var memberUserId = members.Single(m => string.Equals(m.Email, memberEmail, StringComparison.OrdinalIgnoreCase)).UserId;

        var sharedList = await owner.CreateListAsync(
            name: $"Shared {Guid.NewGuid():N}",
            type: "Custom",
            colorHex: "#00AAFF",
            visibilityMode: "SpecificMembers",
            allowedUserIds: new[] { memberUserId });

        var listsForMember = await member.GetListsAsync();
        Assert.Contains(listsForMember, l => l.Id == sharedList.Id);

        var row = listsForMember.Single(l => l.Id == sharedList.Id);
        Assert.Equal("SpecificMembers", row.VisibilityMode);
        Assert.NotNull(row.SharedWithMembers);
        Assert.Contains(row.SharedWithMembers!, m => m.UserId == memberUserId);
    }

    [Fact]
    public async Task Activity_And_Notifications_Workflow()
    {
        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");

        var ownerEmail = $"owner-{Guid.NewGuid():N}@example.com";
        var memberEmail = $"member-{Guid.NewGuid():N}@example.com";

        var owner = new ApiTestClient(_factory.CreateHttpsClient());
        var ownerAuth = await owner.RegisterAsync("Owner", ownerEmail, password);
        owner.SetBearerToken(ownerAuth.AccessToken);

        var family = await owner.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var invite = await owner.CreateFamilyInviteAsync(family.Id, daysValid: 7);
        var token = invite.InviteUrl.Split("/invite/", StringSplitOptions.RemoveEmptyEntries).Last();

        var member = new ApiTestClient(_factory.CreateHttpsClient());
        var memberAuth = await member.RegisterAsync("Member", memberEmail, password);
        member.SetBearerToken(memberAuth.AccessToken);
        await member.JoinFamilyInviteAsync(token);

        var members = await owner.GetCurrentFamilyMembersAsync();
        var memberUserId = members.Single(m => string.Equals(m.Email, memberEmail, StringComparison.OrdinalIgnoreCase)).UserId;

        var list = await owner.CreateListAsync($"Groceries {Guid.NewGuid():N}", type: "Shopping", colorHex: "#00AAFF");
        await member.AddListItemAsync(list.Id, "Milk");

        var recent = await owner.GetRecentActivityAsync(take: 20);
        Assert.Contains(recent, a => a.Kind == "listitems:added" && a.ActorUserId == memberUserId && a.ListId == list.Id);

        var unread = await owner.GetUnreadNotificationsAsync(take: 50);
        Assert.Contains(unread, n => n.Kind == "listitems:added" && n.ActorUserId == memberUserId && n.ListId == list.Id);

        await owner.MarkAllNotificationsSeenAsync();

        var unreadAfter = await owner.GetUnreadNotificationsAsync(take: 50);
        Assert.Empty(unreadAfter);
    }

    [Fact]
    public async Task Activity_Filter_ByType_AndDate_Works()
    {
        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");

        var ownerEmail = $"owner-{Guid.NewGuid():N}@example.com";

        var owner = new ApiTestClient(_factory.CreateHttpsClient());
        var ownerAuth = await owner.RegisterAsync("Owner", ownerEmail, password);
        owner.SetBearerToken(ownerAuth.AccessToken);

        await owner.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var list = await owner.CreateListAsync($"Groceries {Guid.NewGuid():N}", type: "Shopping", colorHex: "#00AAFF");
        await owner.AddListItemAsync(list.Id, "Milk");

        await owner.CreateBudgetAsync($"Budget {Guid.NewGuid():N}", startDate: DateOnly.FromDateTime(DateTime.UtcNow));

        var evStart = DateTime.UtcNow.AddHours(1);
        await owner.CreateCalendarEventAsync($"Event {Guid.NewGuid():N}", evStart, evStart.AddHours(2));

        var all = await owner.GetActivityAsync(skip: 0, take: 200);
        Assert.NotEmpty(all);

        Assert.Contains(all, a => a.Kind == "listitems:added");
        Assert.Contains(all, a => a.Kind == "budgets:created");
        Assert.Contains(all, a => a.Kind == "calendar:created");

        var listsOnly = await owner.GetActivityAsync(skip: 0, take: 200, type: "lists");
        Assert.NotEmpty(listsOnly);
        Assert.All(listsOnly, a => Assert.True(
            a.Kind.StartsWith("lists:") || a.Kind.StartsWith("listitems:"),
            $"Unexpected kind: {a.Kind}"));

        var budgetsOnly = await owner.GetActivityAsync(skip: 0, take: 200, type: "budget");
        Assert.NotEmpty(budgetsOnly);
        Assert.All(budgetsOnly, a => Assert.StartsWith("budgets:", a.Kind));

        var calendarOnly = await owner.GetActivityAsync(skip: 0, take: 200, type: "calendar");
        Assert.NotEmpty(calendarOnly);
        Assert.All(calendarOnly, a => Assert.StartsWith("calendar:", a.Kind));

        var day = DateOnly.FromDateTime(all.First().CreatedAtUtc);

        var listsToday = await owner.GetActivityAsync(skip: 0, take: 200, type: "lists", dateUtc: day);
        Assert.NotEmpty(listsToday);
        Assert.All(listsToday, a => Assert.True(
            a.Kind.StartsWith("lists:") || a.Kind.StartsWith("listitems:"),
            $"Unexpected kind: {a.Kind}"));

        var listsPreviousDay = await owner.GetActivityAsync(skip: 0, take: 200, type: "lists", dateUtc: day.AddDays(-1));
        Assert.Empty(listsPreviousDay);
    }
}
