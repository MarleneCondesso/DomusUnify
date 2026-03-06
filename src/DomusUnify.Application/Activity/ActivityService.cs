using DomusUnify.Application.Activity.Models;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Notifications;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Activity;

/// <summary>
/// Implementação do serviço de feed de atividade.
/// </summary>
public sealed class ActivityService : IActivityService
{
    private readonly IAppDbContext _db;
    private readonly IActivityPushNotifier _pushNotifier;

    /// <summary>
    /// Inicializa uma nova instância de <see cref="ActivityService"/>.
    /// </summary>
    /// <param name="db">Contexto de base de dados.</param>
    /// <param name="pushNotifier">Despachante de notificações push.</param>
    public ActivityService(IAppDbContext db, IActivityPushNotifier pushNotifier)
    {
        _db = db;
        _pushNotifier = pushNotifier;
    }

    /// <inheritdoc />
    public async Task LogAsync(Guid familyId, Guid actorUserId, ActivityLogInput input, CancellationToken ct)
    {
        var kind = (input.Kind ?? "").Trim();
        var message = (input.Message ?? "").Trim();

        if (string.IsNullOrWhiteSpace(kind))
            throw new ArgumentException("Kind é obrigatório.");

        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Message é obrigatório.");

        var entry = new ActivityEntry
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            ActorUserId = actorUserId,
            Kind = kind,
            Message = message,
            ListId = input.ListId,
            EntityId = input.EntityId,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.ActivityEntries.Add(entry);
        await _db.SaveChangesAsync(ct);
        await _pushNotifier.NotifyAsync(entry, ct);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ActivityEntryModel>> GetRecentAsync(Guid userId, Guid familyId, int take, CancellationToken ct)
        => GetAsync(
            userId,
            familyId,
            skip: 0,
            take: take,
            type: null,
            fromUtc: null,
            toUtc: null,
            dateUtc: null,
            ct);

    /// <inheritdoc />
    public async Task<IReadOnlyList<ActivityEntryModel>> GetAsync(
        Guid userId,
        Guid familyId,
        int skip,
        int take,
        string? type,
        DateTime? fromUtc,
        DateTime? toUtc,
        DateOnly? dateUtc,
        CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        skip = Math.Max(0, skip);
        take = Math.Clamp(take, 1, 200);

        type = NormalizeType(type);

        if (dateUtc.HasValue && (fromUtc.HasValue || toUtc.HasValue))
            throw new ArgumentException("dateUtc não pode ser usado em conjunto com fromUtc/toUtc.");

        DateTime? finalFromUtc = null;
        DateTime? finalToUtc = null;

        if (dateUtc.HasValue)
        {
            finalFromUtc = new DateTime(dateUtc.Value.Year, dateUtc.Value.Month, dateUtc.Value.Day, 0, 0, 0, DateTimeKind.Utc);
            finalToUtc = finalFromUtc.Value.AddDays(1);
        }
        else
        {
            if (fromUtc.HasValue) finalFromUtc = NormalizeUtc(fromUtc.Value);
            if (toUtc.HasValue) finalToUtc = NormalizeUtc(toUtc.Value);
        }

        if (finalFromUtc.HasValue && finalToUtc.HasValue && finalToUtc.Value <= finalFromUtc.Value)
            throw new ArgumentException("Intervalo inválido: toUtc tem de ser maior do que fromUtc.");

        var accessibleListIds = await GetAccessibleListIdsAsync(userId, familyId, ct);
        var accessibleBudgetIds = await GetAccessibleBudgetIdsAsync(userId, familyId, ct);
        var visibleCalendarEventIds = await GetVisibleCalendarEventIdsAsync(userId, familyId, ct);

        IQueryable<ActivityEntry> q = _db.ActivityEntries
            .AsNoTracking()
            .Where(a => a.FamilyId == familyId);

        if (finalFromUtc.HasValue)
            q = q.Where(a => a.CreatedAtUtc >= finalFromUtc.Value);

        if (finalToUtc.HasValue)
            q = q.Where(a => a.CreatedAtUtc < finalToUtc.Value);

        if (type is not null)
        {
            q = type switch
            {
                "lists" => q.Where(a => a.Kind.StartsWith("lists:") || a.Kind.StartsWith("listitems:")),
                "budget" => q.Where(a => a.Kind.StartsWith("budgets:")),
                "calendar" => q.Where(a => a.Kind.StartsWith("calendar:")),
                _ => throw new ArgumentException("Tipo inválido. Use: lists, budget, calendar.")
            };
        }

        q = q
            .Where(a => a.ListId == null || accessibleListIds.Contains(a.ListId.Value))
            .Where(a =>
                !a.Kind.StartsWith("budgets:") ||
                a.Kind == "budgets:deleted" ||
                (a.EntityId != null && accessibleBudgetIds.Contains(a.EntityId.Value)))
            .Where(a =>
                !a.Kind.StartsWith("calendar:") ||
                a.Kind == "calendar:deleted" ||
                (a.EntityId != null && visibleCalendarEventIds.Contains(a.EntityId.Value)));

        return await q
            .OrderByDescending(a => a.CreatedAtUtc)
            .Skip(skip)
            .Take(take)
            .Select(a => new ActivityEntryModel(
                a.Id,
                a.Kind,
                a.Message,
                a.ActorUserId,
                a.ActorUser.Name,
                a.CreatedAtUtc,
                a.ListId,
                a.EntityId))
            .ToListAsync(ct);
    }

    private async Task<List<Guid>> GetAccessibleListIdsAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        return await _db.Lists
            .AsNoTracking()
            .Where(l => l.FamilyId == familyId)
            .Where(l =>
                l.VisibilityMode == ListVisibilityMode.AllMembers ||
                l.OwnerUserId == userId ||
                (l.VisibilityMode == ListVisibilityMode.SpecificMembers && l.AllowedUsers.Any(a => a.UserId == userId)))
            .Select(l => l.Id)
            .ToListAsync(ct);
    }

    private async Task<List<Guid>> GetAccessibleBudgetIdsAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        return await _db.Budgets
            .AsNoTracking()
            .Where(b => b.FamilyId == familyId)
            .Where(b =>
                b.VisibilityMode == BudgetVisibilityMode.AllMembers ||
                b.OwnerUserId == userId ||
                (b.VisibilityMode == BudgetVisibilityMode.SpecificMembers && b.AllowedUsers.Any(a => a.UserId == userId)))
            .Select(b => b.Id)
            .ToListAsync(ct);
    }

    private async Task<List<Guid>> GetVisibleCalendarEventIdsAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        return await _db.CalendarEventVisibilities
            .AsNoTracking()
            .Where(v => v.UserId == userId)
            .Where(v => v.Event.FamilyId == familyId)
            .Select(v => v.EventId)
            .Distinct()
            .ToListAsync(ct);
    }

    private static string? NormalizeType(string? type)
    {
        var trimmed = (type ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(trimmed)) return null;
        return trimmed.ToLowerInvariant();
    }

    private static DateTime NormalizeUtc(DateTime value) => value.Kind switch
    {
        DateTimeKind.Utc => value,
        DateTimeKind.Local => value.ToUniversalTime(),
        _ => DateTime.SpecifyKind(value, DateTimeKind.Utc) // assume UTC if unspecified
    };

    private async Task EnsureMemberAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        var isMember = await _db.FamilyMembers
            .AsNoTracking()
            .AnyAsync(m => m.UserId == userId && m.FamilyId == familyId, ct);

        if (!isMember)
            throw new UnauthorizedAccessException("Não és membro desta família.");
    }
}
