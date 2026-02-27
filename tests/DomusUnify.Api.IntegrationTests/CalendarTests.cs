using DomusUnify.Api.IntegrationTests.Helpers;

namespace DomusUnify.Api.IntegrationTests;

public sealed class CalendarTests : IClassFixture<DomusUnifyApiFactory>
{
    private readonly DomusUnifyApiFactory _factory;

    public CalendarTests(DomusUnifyApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Create_List_Delete_CalendarEvent()
    {
        var api = new ApiTestClient(_factory.CreateHttpsClient());

        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");
        var email = $"cal-user-{Guid.NewGuid():N}@example.com";

        var auth = await api.RegisterAsync("Calendar User", email, password);
        api.SetBearerToken(auth.AccessToken);

        await api.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var start = DateTime.UtcNow.AddHours(2);
        var end = start.AddHours(1);

        var created = await api.CreateCalendarEventAsync($"Dentist {Guid.NewGuid():N}", startUtc: start, endUtc: end);
        Assert.NotEqual(Guid.Empty, created.Id);

        var events = await api.GetCalendarEventsAsync(fromUtc: start.AddHours(-1), toUtc: end.AddHours(1));
        Assert.Contains(events, e => e.Id == created.Id);

        await api.DeleteCalendarEventAsync(created.Id);
    }

    [Fact]
    public async Task GetEvents_WithTake_ReturnsOnlyThatMany()
    {
        var api = new ApiTestClient(_factory.CreateHttpsClient());

        var password = TestEnv.Get("DOMUSUNIFY_TEST_PASSWORD", "P@ssw0rd123!");
        var email = $"cal-take-user-{Guid.NewGuid():N}@example.com";

        var auth = await api.RegisterAsync("Calendar User", email, password);
        api.SetBearerToken(auth.AccessToken);

        await api.CreateFamilyAsync($"Family {Guid.NewGuid():N}");

        var start1 = DateTime.UtcNow.AddHours(2);
        var end1 = start1.AddHours(1);
        var start2 = DateTime.UtcNow.AddHours(5);
        var end2 = start2.AddHours(1);

        var e1 = await api.CreateCalendarEventAsync($"Event {Guid.NewGuid():N}", startUtc: start1, endUtc: end1);
        var e2 = await api.CreateCalendarEventAsync($"Event {Guid.NewGuid():N}", startUtc: start2, endUtc: end2);

        var from = DateTime.UtcNow;
        var to = DateTime.UtcNow.AddDays(1);

        var all = await api.GetCalendarEventsAsync(fromUtc: from, toUtc: to);
        Assert.Contains(all, x => x.Id == e1.Id);
        Assert.Contains(all, x => x.Id == e2.Id);
        Assert.Equal(2, all.Count);

        var limited = await api.GetCalendarEventsAsync(fromUtc: from, toUtc: to, take: 1);
        Assert.Single(limited);
        Assert.Equal(e1.Id, limited[0].Id);
    }
}
