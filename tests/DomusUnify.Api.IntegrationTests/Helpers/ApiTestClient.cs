using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace DomusUnify.Api.IntegrationTests.Helpers;

internal sealed record AuthResponseDto(string AccessToken, DateTime ExpiresAtUtc);
internal sealed record FamilyResponseDto(Guid Id, string Name, string Role);
internal sealed record FamilyMemberResponseDto(Guid UserId, string? Name, string? Email, string? Role);
internal sealed record MemberPreviewDto(Guid UserId, string Name);
internal sealed record ListResponseDto(
    Guid Id,
    string Name,
    string Type,
    int ItemsCount,
    int CompletedCount,
    string? ColorHex = null,
    Guid? OwnerUserId = null,
    string? VisibilityMode = null,
    List<Guid>? AllowedUserIds = null,
    List<MemberPreviewDto>? SharedWithMembers = null);
internal sealed record ListItemResponseDto(
    Guid Id,
    Guid ListId,
    string Name,
    bool IsCompleted,
    Guid? CategoryId = null,
    DateTime? CompletedAtUtc = null,
    Guid? CompletedByUserId = null);

internal sealed record ItemCategoryResponseDto(Guid Id, string Name, string IconKey, int SortOrder);
internal sealed record CalendarEventResponseDto(Guid Id, string Title, bool IsAllDay, DateTime StartUtc, DateTime EndUtc);
internal sealed record CreateInviteResultDto(string InviteUrl, DateTime ExpiresAtUtc);
internal sealed record InvitePreviewDto(
    Guid FamilyId,
    string FamilyName,
    Guid InvitedByUserId,
    string InvitedByName,
    DateTime ExpiresAtUtc,
    bool IsExpired,
    bool IsRevoked);

internal sealed record ActivityEntryResponseDto(
    Guid Id,
    string Kind,
    string Message,
    Guid ActorUserId,
    string ActorName,
    DateTime CreatedAtUtc,
    Guid? ListId = null,
    Guid? EntityId = null);

internal sealed record BudgetSummaryResponseDto(
    Guid Id,
    string Name,
    string IconKey,
    string Type,
    string CurrencyCode,
    string VisibilityMode);

internal sealed record BudgetDetailResponseDto(
    Guid Id,
    string Name,
    string Type,
    string? PeriodType,
    DateOnly? StartDate,
    string CurrencyCode,
    string VisibilityMode);

internal sealed record FinanceCategoryResponseDto(Guid Id, string Type, string Name, string IconKey, int SortOrder);
internal sealed record FinanceAccountResponseDto(Guid Id, string Type, string Name, string IconKey, int SortOrder);
internal sealed record FinanceTransactionResponseDto(
    Guid Id,
    Guid BudgetId,
    decimal Amount,
    string Title,
    string Type,
    Guid CategoryId,
    Guid AccountId,
    Guid PaidByUserId,
    DateOnly Date,
    bool IsPaid);

internal sealed class ApiTestClient
{
    private readonly HttpClient _client;

    public ApiTestClient(HttpClient client) => _client = client;

    public void SetBearerToken(string accessToken) =>
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

    public async Task<AuthResponseDto> RegisterAsync(string name, string email, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", new { name, email, password });
        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth);
        Assert.False(string.IsNullOrWhiteSpace(auth!.AccessToken));

        return auth!;
    }

    public async Task<AuthResponseDto> LoginAsync(string email, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth);
        Assert.False(string.IsNullOrWhiteSpace(auth!.AccessToken));

        return auth!;
    }

    public async Task<AuthResponseDto> LoginWithGoogleAsync(string idToken)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/auth/oauth/google", new { idToken });
        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(auth);
        Assert.False(string.IsNullOrWhiteSpace(auth!.AccessToken));

        return auth!;
    }

    public async Task<FamilyResponseDto> GetMyFamilyAsync()
    {
        var response = await _client.GetAsync("/api/v1/families/me");
        response.EnsureSuccessStatusCode();

        var family = await response.Content.ReadFromJsonAsync<FamilyResponseDto>();
        Assert.NotNull(family);
        return family!;
    }

    public async Task<List<FamilyResponseDto>> GetMyFamiliesAsync()
    {
        var response = await _client.GetAsync("/api/v1/families/my");
        response.EnsureSuccessStatusCode();

        var families = await response.Content.ReadFromJsonAsync<List<FamilyResponseDto>>();
        return families ?? [];
    }

    public async Task<FamilyResponseDto> CreateFamilyAsync(string name)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/families", new { name });
        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);

        var family = await response.Content.ReadFromJsonAsync<FamilyResponseDto>();
        Assert.NotNull(family);
        return family!;
    }

    public async Task SetCurrentFamilyAsync(Guid familyId)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/families/set-current", new { familyId });
        Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);
    }

    public async Task<List<FamilyMemberResponseDto>> GetCurrentFamilyMembersAsync()
    {
        var response = await _client.GetAsync("/api/v1/families/members");
        response.EnsureSuccessStatusCode();

        var members = await response.Content.ReadFromJsonAsync<List<FamilyMemberResponseDto>>();
        return members ?? [];
    }

    public async Task<List<ListResponseDto>> GetListsAsync()
    {
        var response = await _client.GetAsync("/api/v1/lists");
        response.EnsureSuccessStatusCode();

        var lists = await response.Content.ReadFromJsonAsync<List<ListResponseDto>>();
        return lists ?? [];
    }

    public async Task<ListResponseDto> CreateListAsync(string name, string type = "Custom", string colorHex = "")
    {
        var response = await _client.PostAsJsonAsync("/api/v1/lists", new
        {
            name,
            type,
            colorHex,
            visibilityMode = "AllMembers",
            allowedUserIds = Array.Empty<Guid>()
        });
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<ListResponseDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task<ListResponseDto> CreateListAsync(
        string name,
        string type,
        string colorHex,
        string visibilityMode,
        IReadOnlyList<Guid>? allowedUserIds = null)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/lists", new
        {
            name,
            type,
            colorHex,
            visibilityMode,
            allowedUserIds
        });
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<ListResponseDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task<List<ListItemResponseDto>> GetListItemsAsync(Guid listId)
    {
        var response = await _client.GetAsync($"/api/v1/lists/{listId}/items");
        response.EnsureSuccessStatusCode();

        var items = await response.Content.ReadFromJsonAsync<List<ListItemResponseDto>>();
        return items ?? [];
    }

    public async Task<ListItemResponseDto> AddListItemAsync(Guid listId, string name)
    {
        var response = await _client.PostAsJsonAsync($"/api/v1/lists/{listId}/items", new { name });
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<ListItemResponseDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task UpdateListItemAsync(Guid itemId, bool? isCompleted = null, string? name = null)
    {
        var payload = new Dictionary<string, object?>();
        if (isCompleted is not null) payload["isCompleted"] = isCompleted;
        if (name is not null) payload["name"] = name;

        var response = await _client.PatchAsync($"/api/v1/lists/items/{itemId}", JsonContent.Create(payload));
        Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);
    }

    public async Task<List<ItemCategoryResponseDto>> GetItemCategoriesAsync()
    {
        var response = await _client.GetAsync("/api/v1/item-categories");
        response.EnsureSuccessStatusCode();

        var categories = await response.Content.ReadFromJsonAsync<List<ItemCategoryResponseDto>>();
        return categories ?? [];
    }

    public async Task<ItemCategoryResponseDto> CreateItemCategoryAsync(string name, string iconKey = "tag", int sortOrder = 0)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/item-categories", new { name, iconKey, sortOrder });
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<ItemCategoryResponseDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task<ItemCategoryResponseDto> UpdateItemCategoryAsync(Guid categoryId, string name, string iconKey = "tag", int sortOrder = 0)
    {
        var response = await _client.PatchAsJsonAsync($"/api/v1/item-categories/{categoryId}", new { name, iconKey, sortOrder });
        response.EnsureSuccessStatusCode();

        var updated = await response.Content.ReadFromJsonAsync<ItemCategoryResponseDto>();
        Assert.NotNull(updated);
        return updated!;
    }

    public async Task DeleteItemCategoryAsync(Guid categoryId)
    {
        var response = await _client.DeleteAsync($"/api/v1/item-categories/{categoryId}");
        Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);
    }

    public async Task<CalendarEventResponseDto> CreateCalendarEventAsync(string title, DateTime startUtc, DateTime endUtc)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/calendar/events", new
        {
            title,
            isAllDay = false,
            startUtc,
            endUtc,
            participantsAllMembers = true,
            participantUserIds = Array.Empty<Guid>(),
            visibleToAllMembers = true,
            visibleToUserIds = Array.Empty<Guid>(),
            reminderOffsetsMinutes = Array.Empty<int>(),
        });
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<CalendarEventResponseDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task<List<CalendarEventResponseDto>> GetCalendarEventsAsync(DateTime fromUtc, DateTime toUtc, int? take = null)
    {
        var from = Uri.EscapeDataString(fromUtc.ToString("O"));
        var to = Uri.EscapeDataString(toUtc.ToString("O"));

        var url = $"/api/v1/calendar/events?fromUtc={from}&toUtc={to}";
        if (take.HasValue) url += $"&take={take.Value}";

        var response = await _client.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var events = await response.Content.ReadFromJsonAsync<List<CalendarEventResponseDto>>();
        return events ?? [];
    }

    public async Task DeleteCalendarEventAsync(Guid eventId)
    {
        var response = await _client.DeleteAsync($"/api/v1/calendar/events/{eventId}");
        Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);
    }

    public async Task<BudgetDetailResponseDto> CreateBudgetAsync(string name, DateOnly startDate)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/budgets", new
        {
            name,
            iconKey = "wallet",
            type = "Recurring",
            periodType = "Monthly",
            startDate,
            currencyCode = "EUR",
            visibilityMode = "AllMembers",
        });
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<BudgetDetailResponseDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task<List<BudgetSummaryResponseDto>> GetBudgetsAsync()
    {
        var response = await _client.GetAsync("/api/v1/budgets");
        response.EnsureSuccessStatusCode();

        var budgets = await response.Content.ReadFromJsonAsync<List<BudgetSummaryResponseDto>>();
        return budgets ?? [];
    }

    public async Task<BudgetDetailResponseDto> GetBudgetByIdAsync(Guid budgetId)
    {
        var response = await _client.GetAsync($"/api/v1/budgets/{budgetId}");
        response.EnsureSuccessStatusCode();

        var budget = await response.Content.ReadFromJsonAsync<BudgetDetailResponseDto>();
        Assert.NotNull(budget);
        return budget!;
    }

    public async Task<List<FinanceCategoryResponseDto>> GetFinanceCategoriesAsync(string? type = null)
    {
        var url = string.IsNullOrWhiteSpace(type)
            ? "/api/v1/finance-categories"
            : $"/api/v1/finance-categories?type={Uri.EscapeDataString(type)}";

        var response = await _client.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var categories = await response.Content.ReadFromJsonAsync<List<FinanceCategoryResponseDto>>();
        return categories ?? [];
    }

    public async Task<FinanceCategoryResponseDto> CreateFinanceCategoryAsync(string type, string name, string iconKey = "tag", int sortOrder = 0)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/finance-categories", new { type, name, iconKey, sortOrder });
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<FinanceCategoryResponseDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task<List<FinanceAccountResponseDto>> GetFinanceAccountsAsync()
    {
        var response = await _client.GetAsync("/api/v1/finance-accounts");
        response.EnsureSuccessStatusCode();

        var accounts = await response.Content.ReadFromJsonAsync<List<FinanceAccountResponseDto>>();
        return accounts ?? [];
    }

    public async Task<FinanceAccountResponseDto> CreateFinanceAccountAsync(string type, string name, string iconKey = "credit-card", int sortOrder = 0)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/finance-accounts", new { type, name, iconKey, sortOrder });
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<FinanceAccountResponseDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task<FinanceTransactionResponseDto> CreateFinanceTransactionAsync(
        Guid budgetId,
        decimal amount,
        string title,
        string type,
        Guid categoryId,
        Guid accountId,
        Guid paidByUserId,
        DateOnly? date = null,
        bool isPaid = false)
    {
        var response = await _client.PostAsJsonAsync($"/api/v1/budgets/{budgetId}/transactions", new
        {
            amount,
            title,
            type,
            categoryId,
            accountId,
            paidByUserId,
            date,
            isPaid,
            repeatType = "None",
            reminderType = "None",
        });
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<FinanceTransactionResponseDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task<List<FinanceTransactionResponseDto>> GetFinanceTransactionsAsync(Guid budgetId)
    {
        var response = await _client.GetAsync($"/api/v1/budgets/{budgetId}/transactions");
        response.EnsureSuccessStatusCode();

        var rows = await response.Content.ReadFromJsonAsync<List<FinanceTransactionResponseDto>>();
        return rows ?? [];
    }

    public async Task<CreateInviteResultDto> CreateFamilyInviteAsync(Guid familyId, int daysValid = 7, int? maxUses = null)
    {
        var url = maxUses.HasValue
            ? $"/api/v1/families/{familyId}/invites?daysValid={daysValid}&maxUses={maxUses.Value}"
            : $"/api/v1/families/{familyId}/invites?daysValid={daysValid}";

        var response = await _client.PostAsync(url, content: null);
        response.EnsureSuccessStatusCode();

        var created = await response.Content.ReadFromJsonAsync<CreateInviteResultDto>();
        Assert.NotNull(created);
        return created!;
    }

    public async Task<InvitePreviewDto> PreviewFamilyInviteAsync(string token)
    {
        var response = await _client.GetAsync($"/api/v1/families/invites/preview?token={Uri.EscapeDataString(token)}");
        response.EnsureSuccessStatusCode();

        var preview = await response.Content.ReadFromJsonAsync<InvitePreviewDto>();
        Assert.NotNull(preview);
        return preview!;
    }

    public async Task JoinFamilyInviteAsync(string token)
    {
        var response = await _client.PostAsJsonAsync("/api/v1/families/invites/join", new { token });
        Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);
    }

    public async Task<List<ActivityEntryResponseDto>> GetRecentActivityAsync(int take = 4)
    {
        var response = await _client.GetAsync($"/api/v1/activity/recent?take={take}");
        response.EnsureSuccessStatusCode();

        var rows = await response.Content.ReadFromJsonAsync<List<ActivityEntryResponseDto>>();
        return rows ?? [];
    }

    public async Task<List<ActivityEntryResponseDto>> GetActivityAsync(
        int skip = 0,
        int take = 50,
        string? type = null,
        DateTime? fromUtc = null,
        DateTime? toUtc = null,
        DateOnly? dateUtc = null)
    {
        var qs = new List<string> { $"skip={skip}", $"take={take}" };
        if (!string.IsNullOrWhiteSpace(type)) qs.Add($"type={Uri.EscapeDataString(type)}");
        if (fromUtc.HasValue) qs.Add($"fromUtc={Uri.EscapeDataString(fromUtc.Value.ToString("O"))}");
        if (toUtc.HasValue) qs.Add($"toUtc={Uri.EscapeDataString(toUtc.Value.ToString("O"))}");
        if (dateUtc.HasValue) qs.Add($"dateUtc={Uri.EscapeDataString(dateUtc.Value.ToString("yyyy-MM-dd"))}");

        var url = $"/api/v1/activity?{string.Join("&", qs)}";

        var response = await _client.GetAsync(url);
        response.EnsureSuccessStatusCode();

        var rows = await response.Content.ReadFromJsonAsync<List<ActivityEntryResponseDto>>();
        return rows ?? [];
    }

    public async Task<List<ActivityEntryResponseDto>> GetUnreadNotificationsAsync(int take = 50)
    {
        var response = await _client.GetAsync($"/api/v1/notifications/unread?take={take}");
        response.EnsureSuccessStatusCode();

        var rows = await response.Content.ReadFromJsonAsync<List<ActivityEntryResponseDto>>();
        return rows ?? [];
    }

    public async Task MarkAllNotificationsSeenAsync()
    {
        var response = await _client.PostAsync("/api/v1/notifications/mark-all-seen", content: null);
        Assert.Equal(System.Net.HttpStatusCode.NoContent, response.StatusCode);
    }
}
