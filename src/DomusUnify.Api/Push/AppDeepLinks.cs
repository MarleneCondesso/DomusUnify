using DomusUnify.Domain.Entities;

namespace DomusUnify.Api.Push;

internal static class AppDeepLinks
{
    public static string Home(Guid familyId) => Build("/",
        ("familyId", familyId.ToString()));

    public static string Notifications(Guid familyId) => Build("/notifications",
        ("familyId", familyId.ToString()));

    public static string CalendarWeek(Guid familyId, DateOnly date) => Build("/calendar",
        ("familyId", familyId.ToString()),
        ("view", "week"),
        ("date", date.ToString("yyyy-MM-dd")));

    public static string CalendarDay(Guid familyId, DateOnly date) => Build("/calendar",
        ("familyId", familyId.ToString()),
        ("view", "day"),
        ("date", date.ToString("yyyy-MM-dd")));

    public static string Budget(Guid familyId, Guid budgetId) => Build($"/budgets/{budgetId}",
        ("familyId", familyId.ToString()));

    public static string Lists(Guid familyId) => Build("/lists",
        ("familyId", familyId.ToString()));

    public static string List(Guid familyId, Guid listId) => Build($"/lists/items/{listId}",
        ("familyId", familyId.ToString()));

    public static string FromActivity(ActivityEntry entry)
    {
        if (entry.Kind.StartsWith("budgets:", StringComparison.OrdinalIgnoreCase))
        {
            return entry.Kind.Equals("budgets:deleted", StringComparison.OrdinalIgnoreCase) || entry.EntityId is null
                ? Notifications(entry.FamilyId)
                : Budget(entry.FamilyId, entry.EntityId.Value);
        }

        if (entry.Kind.StartsWith("calendar:", StringComparison.OrdinalIgnoreCase))
        {
            var date = DateOnly.FromDateTime(entry.CreatedAtUtc);
            return CalendarDay(entry.FamilyId, date);
        }

        if (entry.ListId.HasValue)
            return List(entry.FamilyId, entry.ListId.Value);

        return Lists(entry.FamilyId);
    }

    private static string Build(string route, params (string Key, string? Value)[] query)
    {
        var normalizedRoute = string.IsNullOrWhiteSpace(route) ? "/" : route.Trim();
        if (!normalizedRoute.StartsWith('/'))
            normalizedRoute = $"/{normalizedRoute}";

        var queryString = string.Join(
            "&",
            query
                .Where(pair => !string.IsNullOrWhiteSpace(pair.Value))
                .Select(pair => $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value!)}"));

        return string.IsNullOrEmpty(queryString)
            ? $"/#{normalizedRoute}"
            : $"/#{normalizedRoute}?{queryString}";
    }
}
