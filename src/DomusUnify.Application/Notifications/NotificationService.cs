using DomusUnify.Application.Activity.Models;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Notifications;

/// <summary>
/// Implementação do serviço de notificações (não vistas).
/// </summary>
public sealed class NotificationService : INotificationService
{
    private readonly IAppDbContext _db;

    /// <summary>
    /// Inicializa uma nova instância de <see cref="NotificationService"/>.
    /// </summary>
    /// <param name="db">Contexto de base de dados.</param>
    public NotificationService(IAppDbContext db) => _db = db;

    /// <inheritdoc />
    public async Task<IReadOnlyList<ActivityEntryModel>> GetUnreadAsync(Guid userId, Guid familyId, int take, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        take = Math.Clamp(take, 1, 200);

        var lastSeen = await _db.UserNotificationStates
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.FamilyId == familyId)
            .Select(s => s.LastSeenAtUtc)
            .FirstOrDefaultAsync(ct);

        var cutoff = lastSeen ?? DateTime.MinValue;

        var accessibleListIds = await GetAccessibleListIdsAsync(userId, familyId, ct);
        var accessibleBudgetIds = await GetAccessibleBudgetIdsAsync(userId, familyId, ct);
        var visibleCalendarEventIds = await GetVisibleCalendarEventIdsAsync(userId, familyId, ct);

        return await _db.ActivityEntries
            .AsNoTracking()
            .Where(a => a.FamilyId == familyId)
            .Where(a => a.ActorUserId != userId)
            .Where(a => a.CreatedAtUtc > cutoff)
            .Where(a => a.ListId == null || accessibleListIds.Contains(a.ListId.Value))
            .Where(a =>
                !a.Kind.StartsWith("budgets:") ||
                a.Kind == "budgets:deleted" ||
                (a.EntityId != null && accessibleBudgetIds.Contains(a.EntityId.Value)))
            .Where(a =>
                !a.Kind.StartsWith("calendar:") ||
                a.Kind == "calendar:deleted" ||
                (a.EntityId != null && visibleCalendarEventIds.Contains(a.EntityId.Value)))
            .OrderByDescending(a => a.CreatedAtUtc)
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

    /// <inheritdoc />
    public async Task MarkAllSeenAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        var now = DateTime.UtcNow;

        var state = await _db.UserNotificationStates
            .FirstOrDefaultAsync(s => s.UserId == userId && s.FamilyId == familyId, ct);

        if (state is null)
        {
            _db.UserNotificationStates.Add(new UserNotificationState
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                FamilyId = familyId,
                LastSeenAtUtc = now,
                CreatedAtUtc = now
            });
        }
        else
        {
            state.LastSeenAtUtc = now;
            state.UpdatedAtUtc = now;
        }

        await _db.SaveChangesAsync(ct);
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

    private async Task EnsureMemberAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        var isMember = await _db.FamilyMembers
            .AsNoTracking()
            .AnyAsync(m => m.UserId == userId && m.FamilyId == familyId, ct);

        if (!isMember)
            throw new UnauthorizedAccessException("Não és membro desta família.");
    }
}
