using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Notifications;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WebPush;

namespace DomusUnify.Api.Push;

/// <summary>
/// Envia Web Push com base nas entradas do feed de atividade.
/// </summary>
public sealed class WebPushActivityNotifier : IActivityPushNotifier
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAppDbContext _db;
    private readonly ILogger<WebPushActivityNotifier> _logger;
    private readonly WebPushOptions _options;
    private readonly WebPushClient _client = new();

    public WebPushActivityNotifier(
        IAppDbContext db,
        IOptions<WebPushOptions> options,
        ILogger<WebPushActivityNotifier> logger)
    {
        _db = db;
        _logger = logger;
        _options = options.Value;
    }

    /// <inheritdoc />
    public async Task NotifyAsync(ActivityEntry entry, CancellationToken ct)
    {
        if (!HasValidConfiguration())
            return;

        var category = GetCategory(entry.Kind);
        if (category is not { } resolvedCategory)
            return;

        var actorName = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == entry.ActorUserId)
            .Select(u => u.Name)
            .FirstOrDefaultAsync(ct) ?? "Domus member";

        var recipientIds = await _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.FamilyId == entry.FamilyId && m.UserId != entry.ActorUserId)
            .Select(m => m.UserId)
            .ToListAsync(ct);

        if (recipientIds.Count == 0)
            return;

        var subscriptions = await _db.WebPushSubscriptions
            .Where(s => recipientIds.Contains(s.UserId))
            .Where(s => s.NotificationsEnabled)
            .Where(s =>
                resolvedCategory == PushCategory.Lists ? s.ListsEnabled :
                resolvedCategory == PushCategory.Budget ? s.BudgetEnabled :
                s.CalendarEnabled)
            .ToListAsync(ct);

        if (subscriptions.Count == 0)
            return;

        var vapidDetails = new VapidDetails(_options.Subject.Trim(), _options.PublicKey.Trim(), _options.PrivateKey.Trim());
        var staleSubscriptions = new List<WebPushSubscription>();

        foreach (var subscription in subscriptions)
        {
            if (!await CanReceiveAsync(subscription.UserId, entry, ct))
                continue;

            var payload = BuildPayload(entry, actorName, resolvedCategory);

            try
            {
                await _client.SendNotificationAsync(
                    new PushSubscription(subscription.Endpoint, subscription.P256Dh, subscription.Auth),
                    JsonSerializer.Serialize(payload, JsonOptions),
                    vapidDetails,
                    ct);
            }
            catch (WebPushException ex) when (ex.StatusCode is HttpStatusCode.Gone or HttpStatusCode.NotFound)
            {
                staleSubscriptions.Add(subscription);
            }
            catch (WebPushException ex)
            {
                _logger.LogWarning(
                    ex,
                    "Falha ao enviar Web Push para utilizador {UserId} com status {StatusCode}.",
                    subscription.UserId,
                    ex.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Falha inesperada ao enviar Web Push para utilizador {UserId}.",
                    subscription.UserId);
            }
        }

        if (staleSubscriptions.Count > 0)
        {
            _db.WebPushSubscriptions.RemoveRange(staleSubscriptions);
            await _db.SaveChangesAsync(ct);
        }
    }

    private bool HasValidConfiguration()
    {
        return !string.IsNullOrWhiteSpace(_options.Subject)
            && !string.IsNullOrWhiteSpace(_options.PublicKey)
            && !string.IsNullOrWhiteSpace(_options.PrivateKey);
    }

    private async Task<bool> CanReceiveAsync(Guid userId, ActivityEntry entry, CancellationToken ct)
    {
        if (entry.Kind.StartsWith("budgets:", StringComparison.OrdinalIgnoreCase))
        {
            if (entry.Kind.Equals("budgets:deleted", StringComparison.OrdinalIgnoreCase))
                return true;

            if (!entry.EntityId.HasValue)
                return false;

            return await _db.Budgets
                .AsNoTracking()
                .Where(b => b.Id == entry.EntityId.Value && b.FamilyId == entry.FamilyId)
                .AnyAsync(b =>
                    b.VisibilityMode == BudgetVisibilityMode.AllMembers ||
                    b.OwnerUserId == userId ||
                    (b.VisibilityMode == BudgetVisibilityMode.SpecificMembers && b.AllowedUsers.Any(a => a.UserId == userId)),
                    ct);
        }

        if (entry.Kind.StartsWith("calendar:", StringComparison.OrdinalIgnoreCase))
        {
            if (entry.Kind.Equals("calendar:deleted", StringComparison.OrdinalIgnoreCase))
                return true;

            if (!entry.EntityId.HasValue)
                return false;

            return await _db.CalendarEventVisibilities
                .AsNoTracking()
                .AnyAsync(v => v.EventId == entry.EntityId.Value && v.UserId == userId && v.Event.FamilyId == entry.FamilyId, ct);
        }

        if (!entry.ListId.HasValue)
            return true;

        return await _db.Lists
            .AsNoTracking()
            .Where(l => l.Id == entry.ListId.Value && l.FamilyId == entry.FamilyId)
            .AnyAsync(l =>
                l.VisibilityMode == ListVisibilityMode.AllMembers ||
                l.OwnerUserId == userId ||
                (l.VisibilityMode == ListVisibilityMode.SpecificMembers && l.AllowedUsers.Any(a => a.UserId == userId)),
                ct);
    }

    private static PushPayload BuildPayload(ActivityEntry entry, string actorName, PushCategory category)
    {
        var body = $"{actorName} {entry.Message}".Trim();
        return new PushPayload(
            Title: "DomusUnify",
            Body: body,
            Url: AppDeepLinks.FromActivity(entry),
            Tag: $"activity:{entry.Id}",
            Category: category.ToString().ToLowerInvariant(),
            FamilyId: entry.FamilyId,
            CreatedAtUtc: entry.CreatedAtUtc,
            Icon: "/pwa-192x192.png",
            Badge: "/pwa-192x192.png");
    }

    private static PushCategory? GetCategory(string kind)
    {
        if (kind.StartsWith("lists:", StringComparison.OrdinalIgnoreCase) || kind.StartsWith("listitems:", StringComparison.OrdinalIgnoreCase))
            return PushCategory.Lists;

        if (kind.StartsWith("budgets:", StringComparison.OrdinalIgnoreCase))
            return PushCategory.Budget;

        if (kind.StartsWith("calendar:", StringComparison.OrdinalIgnoreCase))
            return PushCategory.Calendar;

        return null;
    }

    private enum PushCategory
    {
        Lists,
        Budget,
        Calendar
    }

    private sealed record PushPayload(
        string Title,
        string Body,
        string Url,
        string Tag,
        string Category,
        Guid FamilyId,
        DateTime CreatedAtUtc,
        string Icon,
        string Badge);
}
