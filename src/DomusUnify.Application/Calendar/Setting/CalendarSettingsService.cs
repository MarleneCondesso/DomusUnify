using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;
using DomusUnify.Application.Calendar.Models;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Calendar;

public sealed class CalendarSettingsService : ICalendarSettingsService
{
    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;

    public CalendarSettingsService(IAppDbContext db, IRealtimeNotifier rt)
    {
        _db = db;
        _rt = rt;
    }

    // ---------------- FAMILY SETTINGS ----------------

    public async Task<FamilyCalendarSettingsModel> GetFamilySettingsAsync(
        Guid userId,
        Guid familyId,
        CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        var entity = await _db.FamilyCalendarSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.FamilyId == familyId, ct);

        if (entity is null)
        {
            entity = new FamilyCalendarSettings
            {
                Id = Guid.NewGuid(),
                FamilyId = familyId,
                HolidaysCountryCode = "PT",
                DailyReminderEnabled = false,
                CreatedAtUtc = DateTime.UtcNow
            };

            _db.FamilyCalendarSettings.Add(entity);
            await _db.SaveChangesAsync(ct);
        }

        return new FamilyCalendarSettingsModel(
            entity.CalendarColorHex,
            entity.HolidaysCountryCode,
            entity.DailyReminderEnabled,
            entity.CleanupOlderThanMonths,
            entity.CleanupOlderThanYears
        );
    }

    public async Task<FamilyCalendarSettingsModel> UpdateFamilySettingsAsync(
        Guid userId,
        Guid familyId,
        UpdateFamilyCalendarSettingsModel model,
        CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var entity = await _db.FamilyCalendarSettings
            .FirstOrDefaultAsync(x => x.FamilyId == familyId, ct);

        if (entity is null)
        {
            entity = new FamilyCalendarSettings
            {
                Id = Guid.NewGuid(),
                FamilyId = familyId,
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.FamilyCalendarSettings.Add(entity);
        }

        if (model.CalendarColorHex is not null)
            entity.CalendarColorHex = string.IsNullOrWhiteSpace(model.CalendarColorHex)
                ? null
                : model.CalendarColorHex.Trim();

        if (model.HolidaysCountryCode is not null)
            entity.HolidaysCountryCode = model.HolidaysCountryCode.Trim().ToUpperInvariant();

        if (model.DailyReminderEnabled.HasValue)
            entity.DailyReminderEnabled = model.DailyReminderEnabled.Value;

        if (model.CleanupOlderThanMonths.HasValue)
            entity.CleanupOlderThanMonths = model.CleanupOlderThanMonths;

        if (model.CleanupOlderThanYears.HasValue)
            entity.CleanupOlderThanYears = model.CleanupOlderThanYears;

        entity.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new FamilyCalendarSettingsModel(
            entity.CalendarColorHex,
            entity.HolidaysCountryCode,
            entity.DailyReminderEnabled,
            entity.CleanupOlderThanMonths,
            entity.CleanupOlderThanYears
        );
    }

    // ---------------- USER SETTINGS ----------------

    public async Task<UserCalendarSettingsModel> GetUserSettingsAsync(Guid userId, CancellationToken ct)
    {
        var entity = await _db.UserCalendarSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, ct);

        if (entity is null)
        {
            entity = new UserCalendarSettings
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                DailyReminderTime = new TimeOnly(9, 0),
                DailyReminderMode = DailyReminderMode.SameDay,
                CreatedAtUtc = DateTime.UtcNow
            };

            _db.UserCalendarSettings.Add(entity);
            await _db.SaveChangesAsync(ct);
        }

        return new UserCalendarSettingsModel(
            entity.DailyReminderTime,
            entity.DailyReminderMode,
            entity.DefaultEventReminderMinutes
        );
    }

    public async Task<UserCalendarSettingsModel> UpdateUserSettingsAsync(
        Guid userId,
        UpdateUserCalendarSettingsModel model,
        CancellationToken ct)
    {
        var entity = await _db.UserCalendarSettings
            .FirstOrDefaultAsync(x => x.UserId == userId, ct);

        if (entity is null)
        {
            entity = new UserCalendarSettings
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                CreatedAtUtc = DateTime.UtcNow
            };
            _db.UserCalendarSettings.Add(entity);
        }

        if (model.DailyReminderTime.HasValue)
            entity.DailyReminderTime = model.DailyReminderTime.Value;

        if (model.DailyReminderMode.HasValue)
            entity.DailyReminderMode = model.DailyReminderMode.Value;

        if (model.DefaultEventReminderMinutes.HasValue)
            entity.DefaultEventReminderMinutes = model.DefaultEventReminderMinutes;

        entity.UpdatedAtUtc = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        return new UserCalendarSettingsModel(
            entity.DailyReminderTime,
            entity.DailyReminderMode,
            entity.DefaultEventReminderMinutes
        );
    }

    // ---------------- CLEANUP (4.2) ----------------

    public async Task<int> CleanupAsync(
        Guid userId,
        Guid familyId,
        int? months,
        int? years,
        CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        if (!months.HasValue && !years.HasValue)
            throw new ArgumentException("Define meses ou anos.");

        var cutoff = DateTime.UtcNow;

        if (months.HasValue)
            cutoff = cutoff.AddMonths(-months.Value);

        if (years.HasValue)
            cutoff = cutoff.AddYears(-years.Value);

        var events = await _db.CalendarEvents
            .Where(e => e.FamilyId == familyId && e.EndUtc < cutoff)
            .ToListAsync(ct);

        _db.CalendarEvents.RemoveRange(events);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "calendar:changed", new
        {
            action = "cleanup",
            removed = events.Count
        }, ct);

        return events.Count;
    }

    // ---------------- HELPERS ----------------

    private async Task<FamilyRole> EnsureMemberAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        var role = await _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.FamilyId == familyId)
            .Select(m => (FamilyRole?)m.Role)
            .FirstOrDefaultAsync(ct);

        if (role is null)
            throw new UnauthorizedAccessException("Não és membro desta família.");

        return role.Value;
    }

    private static void EnsureNotViewer(FamilyRole role)
    {
        if (role == FamilyRole.Viewer)
            throw new UnauthorizedAccessException("Sem permissões para editar.");
    }
}
