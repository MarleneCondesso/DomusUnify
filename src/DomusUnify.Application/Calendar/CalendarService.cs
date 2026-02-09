using DomusUnify.Application.Calendar.Models;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Application.Common.Realtime;
using DomusUnify.Application.Recurrence;
using DomusUnify.Domain.Entities;
using DomusUnify.Domain.Enums;
using Microsoft.EntityFrameworkCore;
namespace DomusUnify.Application.Calendar;

public sealed class CalendarService : ICalendarService
{
    private readonly IAppDbContext _db;
    private readonly IRealtimeNotifier _rt;
    private readonly IRecurrenceService _rec;
    public CalendarService(IAppDbContext db, IRealtimeNotifier rt, IRecurrenceService rec)
    {
        _db = db;
        _rt = rt;
        _rec = rec;
    }


    public async Task<IReadOnlyList<CalendarEventInstanceModel>> GetEventsAsync(
        Guid userId,
        Guid familyId,
        DateTime? fromUtc,
        DateTime? toUtc,
        DateTime? dateUtc,
        string? search,
        Guid? participantUserId,
        CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        // determinar intervalo final
        DateTime finalFrom;
        DateTime finalTo;

        if (dateUtc.HasValue)
        {
            finalFrom = dateUtc.Value.Date;
            finalTo = finalFrom.AddDays(1);
        }
        else if (fromUtc.HasValue || toUtc.HasValue)
        {
            finalFrom = fromUtc ?? toUtc!.Value.AddDays(-1);
            finalTo = toUtc ?? finalFrom.AddDays(1);
        }
        else
        {
            finalFrom = DateTime.UtcNow.Date.AddDays(-7);
            finalTo = DateTime.UtcNow.Date.AddDays(30);
        }

        // Base: eventos da família visíveis ao user
        var baseQ = _db.CalendarEvents.AsNoTracking()
            .Where(e => e.FamilyId == familyId)
            .Where(e => _db.CalendarEventVisibilities.Any(v => v.EventId == e.Id && v.UserId == userId));

        // filtros de search/participant aplicados ao EVENTO (não à ocorrência)
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search.Trim()}%";
            baseQ = baseQ.Where(e => EF.Functions.Like(e.Title, term));
        }

        if (participantUserId.HasValue)
        {
            var pid = participantUserId.Value;
            baseQ = baseQ.Where(e => _db.CalendarEventParticipants.Any(p => p.EventId == e.Id && p.UserId == pid));
        }

        // 1) pais (ParentEventId == null)
        var parents = await baseQ
            .Where(e => e.ParentEventId == null)
            .ToListAsync(ct);

        var parentIds = parents.Select(e => e.Id).ToList();

        // 2) exceções (filhos) também têm de ser visíveis ao user
        // (porque surpresa: se não estiver na visibilidade, não aparece)
        var exceptions = await _db.CalendarEvents.AsNoTracking()
            .Where(e => e.FamilyId == familyId)
            .Where(e => e.ParentEventId != null && parentIds.Contains(e.ParentEventId.Value))
            .Where(e => _db.CalendarEventVisibilities.Any(v => v.EventId == e.Id && v.UserId == userId))
            .ToListAsync(ct);

        // pré-carregar participants/visibilities/reminders para todos os eventos que vamos materializar
        // (pais + exceções + eventos não recorrentes)
        var allEventIds = parents.Select(x => x.Id).Concat(exceptions.Select(x => x.Id)).Distinct().ToList();

        var participantsByEvent = await _db.CalendarEventParticipants.AsNoTracking()
            .Where(p => allEventIds.Contains(p.EventId))
            .GroupBy(p => p.EventId)
            .ToDictionaryAsync(g => g.Key, g => (IReadOnlyList<Guid>)g.Select(x => x.UserId).ToList(), ct);

        var visibleByEvent = await _db.CalendarEventVisibilities.AsNoTracking()
            .Where(v => allEventIds.Contains(v.EventId))
            .GroupBy(v => v.EventId)
            .ToDictionaryAsync(g => g.Key, g => (IReadOnlyList<Guid>)g.Select(x => x.UserId).ToList(), ct);

        var remindersByEvent = await _db.CalendarEventReminders.AsNoTracking()
            .Where(r => allEventIds.Contains(r.EventId))
            .GroupBy(r => r.EventId)
            .ToDictionaryAsync(g => g.Key, g => (IReadOnlyList<int>)g.Select(x => x.OffsetMinutes).ToList(), ct);

        // expandir
        var instances = new List<CalendarEventInstanceModel>();

        foreach (var p in parents)
        {
            var ex = exceptions.Where(e => e.ParentEventId == p.Id).ToList();
            var occs = _rec.ExpandOccurrences(p, ex, finalFrom, finalTo);

            foreach (var occ in occs)
            {
                // se tiver exceção, “evento real” para os detalhes é a exceção
                var ev = occ.ExceptionEventId.HasValue
                    ? ex.First(x => x.Id == occ.ExceptionEventId.Value)
                    : p;

                participantsByEvent.TryGetValue(ev.Id, out var partIds);
                visibleByEvent.TryGetValue(ev.Id, out var visIds);
                remindersByEvent.TryGetValue(ev.Id, out var rems);

                instances.Add(new CalendarEventInstanceModel(
                    EventId: p.Id,
                    ExceptionEventId: occ.ExceptionEventId,
                    OccurrenceStartUtc: occ.OccurrenceStartUtc,
                    OccurrenceEndUtc: occ.OccurrenceEndUtc,

                    Title: ev.Title,
                    IsAllDay: ev.IsAllDay,
                    Location: ev.Location,
                    Note: ev.Note,
                    ColorHex: ev.ColorHex,
                    TimezoneId: ev.TimezoneId,

                    FamilyId: ev.FamilyId,

                    CreatedByUserId: ev.CreatedByUserId,
                    CreatedAtUtc: ev.CreatedAtUtc,
                    UpdatedAtUtc: ev.UpdatedAtUtc,

                    ParticipantUserIds: partIds ?? Array.Empty<Guid>(),
                    VisibleToUserIds: visIds ?? Array.Empty<Guid>(),
                    ReminderOffsetsMinutes: rems ?? Array.Empty<int>(),

                    IsCancelled: occ.IsCancelled
                ));
            }
        }

        return instances
            .Where(i => !i.IsCancelled)
            .OrderBy(i => i.OccurrenceStartUtc)
            .ToList();
    }

    public async Task<CalendarEventDetailModel> GetEventByIdAsync(
        Guid userId,
        Guid familyId,
        Guid eventId,
        CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        // Só eventos "pai" (séries e eventos single)
        var q = _db.CalendarEvents
            .AsNoTracking()
            .Where(e => e.FamilyId == familyId)
            .Where(e => e.Id == eventId)
            .Where(e => e.ParentEventId == null)
            .Where(e => _db.CalendarEventVisibilities.Any(v => v.EventId == e.Id && v.UserId == userId));

        var model = await q
            .Select(e => new CalendarEventDetailModel(
                e.Id,
                e.FamilyId,
                e.Title,
                e.IsAllDay,
                e.StartUtc,
                e.EndUtc,
                e.Location,
                e.Note,
                e.ColorHex,
                e.RecurrenceRule,
                e.RecurrenceUntilUtc,
                e.RecurrenceCount,
                e.TimezoneId,
                e.CreatedByUserId,
                e.CreatedByUser.Name,
                e.CreatedAtUtc,
                e.UpdatedAtUtc,
                _db.CalendarEventParticipants
                    .Where(p => p.EventId == e.Id)
                    .Select(p => p.UserId)
                    .ToList(),
                _db.CalendarEventVisibilities
                    .Where(v => v.EventId == e.Id)
                    .Select(v => v.UserId)
                    .ToList(),
                _db.CalendarEventReminders
                    .Where(r => r.EventId == e.Id)
                    .Select(r => r.OffsetMinutes)
                    .ToList()
            ))
            .FirstOrDefaultAsync(ct);

        if (model is null)
            throw new KeyNotFoundException("Evento não encontrado (ou não tens permissões).");

        return model;
    }

    public async Task<CalendarEventModel> CreateEventAsync(
        Guid userId,
        Guid familyId,
        string title,
        bool isAllDay,
        DateTime startUtc,
        DateTime endUtc,
        IReadOnlyList<Guid> participantUserIds,
        bool participantsAllMembers,
        IReadOnlyList<Guid> visibleToUserIds,
        bool visibleToAllMembers,
        IReadOnlyList<int> reminderOffsetsMinutes,
        string? location,
        string? note,
        string? colorHex,
        string? recurrenceRule,
        DateTime? recurrenceUntilUtc,
        int? recurrenceCount,
        string? timezoneId,
        CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Título é obrigatório.");
        if (endUtc <= startUtc) throw new ArgumentException("Data fim tem de ser maior que data de início.");

        var memberIds = await _db.FamilyMembers.AsNoTracking()
            .Where(m => m.FamilyId == familyId)
            .Select(m => m.UserId)
            .ToListAsync(ct);

        var finalParticipants = participantsAllMembers ? memberIds : participantUserIds.Distinct().ToList();
        if (finalParticipants.Count == 0) throw new ArgumentException("Seleciona pelo menos 1 participante.");
        if (finalParticipants.Any(id => !memberIds.Contains(id)))
            throw new ArgumentException("Há participantes que não pertencem à família.");

        var finalVisibleTo = visibleToAllMembers ? memberIds : visibleToUserIds.Distinct().ToList();
        if (finalVisibleTo.Count == 0) throw new ArgumentException("Seleciona pelo menos 1 pessoa para ver o evento.");
        if (finalVisibleTo.Any(id => !memberIds.Contains(id)))
            throw new ArgumentException("Há pessoas na visibilidade que não pertencem à família.");

        var now = DateTime.UtcNow;

        var entity = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            Title = title.Trim(),
            IsAllDay = isAllDay,
            StartUtc = startUtc,
            EndUtc = endUtc,
            Location = string.IsNullOrWhiteSpace(location) ? null : location.Trim(),
            Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
            ColorHex = string.IsNullOrWhiteSpace(colorHex) ? null : colorHex.Trim(),
            RecurrenceRule = string.IsNullOrWhiteSpace(recurrenceRule) ? null : recurrenceRule.Trim(),
            RecurrenceUntilUtc = recurrenceUntilUtc,
            RecurrenceCount = recurrenceCount,
            TimezoneId = string.IsNullOrWhiteSpace(timezoneId) ? null : timezoneId.Trim(),
            CreatedByUserId = userId,
            CreatedAtUtc = now
        };

        _db.CalendarEvents.Add(entity);

        foreach (var uid in finalParticipants)
            _db.CalendarEventParticipants.Add(new CalendarEventParticipant { Id = Guid.NewGuid(), EventId = entity.Id, UserId = uid, CreatedAtUtc = now });

        foreach (var uid in finalVisibleTo)
            _db.CalendarEventVisibilities.Add(new CalendarEventVisibility { Id = Guid.NewGuid(), EventId = entity.Id, UserId = uid, CreatedAtUtc = now });

        foreach (var off in reminderOffsetsMinutes.Distinct())
        {
            if (off < 0) throw new ArgumentException("OffsetMinutes não pode ser negativo.");
            _db.CalendarEventReminders.Add(new CalendarEventReminder { Id = Guid.NewGuid(), EventId = entity.Id, OffsetMinutes = off, CreatedAtUtc = now });
        }

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "calendar:changed", new
        {
            action = "created",
            eventId = entity.Id,
            fromUtc = entity.StartUtc,
            toUtc = entity.EndUtc
        }, ct);

        return new CalendarEventModel(
            entity.Id, entity.FamilyId, entity.Title, entity.IsAllDay, entity.StartUtc, entity.EndUtc,
            entity.Location, entity.Note, entity.ColorHex,
            entity.RecurrenceRule, entity.RecurrenceUntilUtc, entity.RecurrenceCount, entity.TimezoneId,
            entity.CreatedByUserId, entity.CreatedAtUtc, entity.UpdatedAtUtc,
            finalParticipants, finalVisibleTo, reminderOffsetsMinutes.Distinct().ToList()
        );
    }

    public async Task<CalendarEventModel> UpdateEventAsync(
        Guid userId,
        Guid familyId,
        Guid eventId,
        string? title,
        bool? isAllDay,
        DateTime? startUtc,
        DateTime? endUtc,
        bool? participantsAllMembers,
        IReadOnlyList<Guid>? participantUserIds,
        bool? visibleToAllMembers,
        IReadOnlyList<Guid>? visibleToUserIds,
        IReadOnlyList<int>? reminderOffsetsMinutes,
        string? location,
        string? note,
        string? colorHex,
        string? recurrenceRule,
        DateTime? recurrenceUntilUtc,
        int? recurrenceCount,
        string? timezoneId,
        CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var e = await _db.CalendarEvents.FirstOrDefaultAsync(x => x.Id == eventId && x.FamilyId == familyId, ct);
        if (e is null) throw new KeyNotFoundException("Evento não encontrado.");

        // atualizar campos simples
        if (title is not null) e.Title = title.Trim();
        if (isAllDay.HasValue) e.IsAllDay = isAllDay.Value;
        if (startUtc.HasValue) e.StartUtc = startUtc.Value;
        if (endUtc.HasValue) e.EndUtc = endUtc.Value;

        if (location is not null) e.Location = string.IsNullOrWhiteSpace(location) ? null : location.Trim();
        if (note is not null) e.Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        if (colorHex is not null) e.ColorHex = string.IsNullOrWhiteSpace(colorHex) ? null : colorHex.Trim();

        if (recurrenceRule is not null) e.RecurrenceRule = string.IsNullOrWhiteSpace(recurrenceRule) ? null : recurrenceRule.Trim();
        if (timezoneId is not null) e.TimezoneId = string.IsNullOrWhiteSpace(timezoneId) ? null : timezoneId.Trim();

        // estes são opcionais, mas se vierem, aplicam
        if (recurrenceUntilUtc.HasValue) e.RecurrenceUntilUtc = recurrenceUntilUtc.Value;
        if (recurrenceCount.HasValue) e.RecurrenceCount = recurrenceCount.Value;

        if (string.IsNullOrWhiteSpace(e.Title)) throw new ArgumentException("Título é obrigatório.");
        if (e.EndUtc <= e.StartUtc) throw new ArgumentException("Data de fim tem de ser maior que data de início.");

        var memberIds = await _db.FamilyMembers.AsNoTracking()
            .Where(m => m.FamilyId == familyId)
            .Select(m => m.UserId)
            .ToListAsync(ct);

        // --- Participants update (se pedido) ---
        var participantsChangeRequested = participantsAllMembers.HasValue || participantUserIds is not null;
        if (participantsChangeRequested)
        {
            var finalParticipants = participantsAllMembers == true
                ? memberIds
                : (participantUserIds ?? Array.Empty<Guid>()).Distinct().ToList();

            if (finalParticipants.Count == 0) throw new ArgumentException("Seleciona pelo menos 1 participante.");
            if (finalParticipants.Any(id => !memberIds.Contains(id)))
                throw new ArgumentException("Há participantes que não pertencem à família.");

            // remove atuais
            var existing = await _db.CalendarEventParticipants.Where(p => p.EventId == eventId).ToListAsync(ct);
            _db.CalendarEventParticipants.RemoveRange(existing);

            var now = DateTime.UtcNow;
            foreach (var uid in finalParticipants)
                _db.CalendarEventParticipants.Add(new CalendarEventParticipant
                {
                    Id = Guid.NewGuid(),
                    EventId = eventId,
                    UserId = uid,
                    CreatedAtUtc = now
                });
        }

        // --- Visibility update (se pedido) ---
        var visibilityChangeRequested = visibleToAllMembers.HasValue || visibleToUserIds is not null;
        if (visibilityChangeRequested)
        {
            var finalVisible = visibleToAllMembers == true
                ? memberIds
                : (visibleToUserIds ?? Array.Empty<Guid>()).Distinct().ToList();

            if (finalVisible.Count == 0) throw new ArgumentException("Seleciona pelo menos 1 pessoa para ver o evento.");
            if (finalVisible.Any(id => !memberIds.Contains(id)))
                throw new ArgumentException("Há pessoas na visibilidade que não pertencem à família.");

            var existing = await _db.CalendarEventVisibilities.Where(v => v.EventId == eventId).ToListAsync(ct);
            _db.CalendarEventVisibilities.RemoveRange(existing);

            var now = DateTime.UtcNow;
            foreach (var uid in finalVisible)
                _db.CalendarEventVisibilities.Add(new CalendarEventVisibility
                {
                    Id = Guid.NewGuid(),
                    EventId = eventId,
                    UserId = uid,
                    CreatedAtUtc = now
                });
        }

        // --- Reminders update (se pedido) ---
        if (reminderOffsetsMinutes is not null)
        {
            if (reminderOffsetsMinutes.Any(x => x < 0)) throw new ArgumentException("Minutos não podem ser negativos.");

            var existing = await _db.CalendarEventReminders.Where(r => r.EventId == eventId).ToListAsync(ct);
            _db.CalendarEventReminders.RemoveRange(existing);

            var now = DateTime.UtcNow;
            foreach (var off in reminderOffsetsMinutes.Distinct())
                _db.CalendarEventReminders.Add(new CalendarEventReminder
                {
                    Id = Guid.NewGuid(),
                    EventId = eventId,
                    OffsetMinutes = off,
                    CreatedAtUtc = now
                });
        }

        e.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "calendar:changed", new
        {
            action = "updated",
            eventId = e.Id,
            fromUtc = e.StartUtc,
            toUtc = e.EndUtc
        }, ct);

        // devolver model (recarrega ids)
        var participants = await _db.CalendarEventParticipants.AsNoTracking()
            .Where(p => p.EventId == e.Id)
            .Select(p => p.UserId)
            .ToListAsync(ct);

        var visible = await _db.CalendarEventVisibilities.AsNoTracking()
            .Where(v => v.EventId == e.Id)
            .Select(v => v.UserId)
            .ToListAsync(ct);

        var reminders = await _db.CalendarEventReminders.AsNoTracking()
            .Where(r => r.EventId == e.Id)
            .Select(r => r.OffsetMinutes)
            .ToListAsync(ct);

        return new CalendarEventModel(
            e.Id, e.FamilyId, e.Title, e.IsAllDay, e.StartUtc, e.EndUtc,
            e.Location, e.Note, e.ColorHex,
            e.RecurrenceRule, e.RecurrenceUntilUtc, e.RecurrenceCount, e.TimezoneId,
            e.CreatedByUserId, e.CreatedAtUtc, e.UpdatedAtUtc,
            participants, visible, reminders);
    }

    public async Task<CalendarEventModel> DuplicateEventAsync(
        Guid userId, Guid familyId, Guid eventId, DateTime newStartUtc, DateTime newEndUtc, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        if (newEndUtc <= newStartUtc) throw new ArgumentException("Data de fim tem de ser maior que data de início.");

        var src = await _db.CalendarEvents.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == eventId && x.FamilyId == familyId, ct);

        if (src is null) throw new KeyNotFoundException("Evento não encontrado.");

        var participants = await _db.CalendarEventParticipants.AsNoTracking()
            .Where(p => p.EventId == eventId)
            .Select(p => p.UserId)
            .ToListAsync(ct);

        var visible = await _db.CalendarEventVisibilities.AsNoTracking()
            .Where(v => v.EventId == eventId)
            .Select(v => v.UserId)
            .ToListAsync(ct);

        var reminders = await _db.CalendarEventReminders.AsNoTracking()
            .Where(r => r.EventId == eventId)
            .Select(r => r.OffsetMinutes)
            .ToListAsync(ct);

        var now = DateTime.UtcNow;
        var newId = Guid.NewGuid();

        var e = new CalendarEvent
        {
            Id = newId,
            FamilyId = familyId,
            Title = src.Title,
            IsAllDay = src.IsAllDay,
            StartUtc = newStartUtc,
            EndUtc = newEndUtc,
            Location = src.Location,
            Note = src.Note,
            ColorHex = src.ColorHex,
            RecurrenceRule = null, // duplicar sem recorrência
            RecurrenceUntilUtc = null,
            RecurrenceCount = null,
            TimezoneId = src.TimezoneId,
            CreatedByUserId = userId,
            CreatedAtUtc = now
        };

        _db.CalendarEvents.Add(e);

        foreach (var uid in participants)
            _db.CalendarEventParticipants.Add(new CalendarEventParticipant { Id = Guid.NewGuid(), EventId = newId, UserId = uid, CreatedAtUtc = now });

        foreach (var uid in visible)
            _db.CalendarEventVisibilities.Add(new CalendarEventVisibility { Id = Guid.NewGuid(), EventId = newId, UserId = uid, CreatedAtUtc = now });

        foreach (var off in reminders.Distinct())
            _db.CalendarEventReminders.Add(new CalendarEventReminder { Id = Guid.NewGuid(), EventId = newId, OffsetMinutes = off, CreatedAtUtc = now });

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "calendar:changed", new
        {
            action = "duplicated",
            eventId = newId,
            fromUtc = e.StartUtc,
            toUtc = e.EndUtc
        }, ct);

        return new CalendarEventModel(
            e.Id, e.FamilyId, e.Title, e.IsAllDay, e.StartUtc, e.EndUtc,
            e.Location, e.Note, e.ColorHex,
            e.RecurrenceRule, e.RecurrenceUntilUtc, e.RecurrenceCount, e.TimezoneId,
            e.CreatedByUserId, e.CreatedAtUtc, e.UpdatedAtUtc,
            participants, visible, reminders);
    }

    public async Task<IReadOnlyList<CalendarEventModel>> CopyEventToDatesAsync(
        Guid userId, Guid familyId, Guid eventId, IReadOnlyList<DateOnly> datesUtc, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        if (datesUtc is null || datesUtc.Count == 0) throw new ArgumentException("Seleciona pelo menos 1 data.");
        if (datesUtc.Count > 30) throw new ArgumentException("Máximo 30 dias.");

        var src = await _db.CalendarEvents.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == eventId && x.FamilyId == familyId, ct);

        if (src is null) throw new KeyNotFoundException("Evento não encontrado.");

        var participants = await _db.CalendarEventParticipants.AsNoTracking()
            .Where(p => p.EventId == eventId)
            .Select(p => p.UserId)
            .ToListAsync(ct);

        var visible = await _db.CalendarEventVisibilities.AsNoTracking()
            .Where(v => v.EventId == eventId)
            .Select(v => v.UserId)
            .ToListAsync(ct);

        var reminders = await _db.CalendarEventReminders.AsNoTracking()
            .Where(r => r.EventId == eventId)
            .Select(r => r.OffsetMinutes)
            .ToListAsync(ct);

        var duration = src.EndUtc - src.StartUtc;
        var startTime = src.StartUtc.TimeOfDay;

        var now = DateTime.UtcNow;
        var created = new List<CalendarEventModel>();

        foreach (var d in datesUtc.Distinct())
        {
            var newStart = d.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc).Add(startTime);
            var newEnd = newStart.Add(duration);

            var newId = Guid.NewGuid();

            var e = new CalendarEvent
            {
                Id = newId,
                FamilyId = familyId,
                Title = src.Title,
                IsAllDay = src.IsAllDay,
                StartUtc = newStart,
                EndUtc = newEnd,
                Location = src.Location,
                Note = src.Note,
                ColorHex = src.ColorHex,
                RecurrenceRule = null,
                RecurrenceUntilUtc = null,
                RecurrenceCount = null,
                TimezoneId = src.TimezoneId,
                CreatedByUserId = userId,
                CreatedAtUtc = now
            };

            _db.CalendarEvents.Add(e);

            foreach (var uid in participants)
                _db.CalendarEventParticipants.Add(new CalendarEventParticipant { Id = Guid.NewGuid(), EventId = newId, UserId = uid, CreatedAtUtc = now });

            foreach (var uid in visible)
                _db.CalendarEventVisibilities.Add(new CalendarEventVisibility { Id = Guid.NewGuid(), EventId = newId, UserId = uid, CreatedAtUtc = now });

            foreach (var off in reminders.Distinct())
                _db.CalendarEventReminders.Add(new CalendarEventReminder { Id = Guid.NewGuid(), EventId = newId, OffsetMinutes = off, CreatedAtUtc = now });

            created.Add(new CalendarEventModel(
                e.Id, e.FamilyId, e.Title, e.IsAllDay, e.StartUtc, e.EndUtc,
                e.Location, e.Note, e.ColorHex,
                e.RecurrenceRule, e.RecurrenceUntilUtc, e.RecurrenceCount, e.TimezoneId,
                e.CreatedByUserId, e.CreatedAtUtc, e.UpdatedAtUtc,
                participants, visible, reminders));
        }

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "calendar:changed", new
        {
            action = "copied",
            eventId,
            count = created.Count
        }, ct);

        return created;
    }


    public async Task DeleteEventAsync(Guid userId, Guid familyId, Guid eventId, CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var e = await _db.CalendarEvents
            .FirstOrDefaultAsync(x => x.Id == eventId && x.FamilyId == familyId, ct);

        if (e is null)
            throw new KeyNotFoundException("Evento não encontrado.");

        _db.CalendarEvents.Remove(e);
        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "calendar:changed", new
        {
            action = "deleted",
            eventId,
            fromUtc = e.StartUtc,
            toUtc = e.EndUtc
        }, ct);
    }

    public async Task UpdateRecurringEventAsync(
        Guid userId,
        Guid familyId,
        Guid eventId,
        CalendarEditScope scope,
        DateTime? occurrenceStartUtc,
        string? title,
        bool? isAllDay,
        DateTime? newStartUtc,
        DateTime? newEndUtc,
        bool? cancelThisOccurrence,
        bool? participantsAllMembers,
        IReadOnlyList<Guid>? participantUserIds,
        bool? visibleToAllMembers,
        IReadOnlyList<Guid>? visibleToUserIds,
        IReadOnlyList<int>? reminderOffsetsMinutes,
        string? location,
        string? note,
        string? colorHex,
        string? timezoneId,
        CancellationToken ct)
    {
        var role = await EnsureMemberAsync(userId, familyId, ct);
        EnsureNotViewer(role);

        var parent = await _db.CalendarEvents.FirstOrDefaultAsync(e => e.Id == eventId && e.FamilyId == familyId && e.ParentEventId == null, ct);

        if (parent is null) throw new KeyNotFoundException("Evento não encontrado.");

        if (parent is null) throw new KeyNotFoundException("Evento não encontrado.");

        var isRecurring = !string.IsNullOrWhiteSpace(parent.RecurrenceRule);

        if (scope != CalendarEditScope.AllOccurrences && !occurrenceStartUtc.HasValue)
            throw new ArgumentException("A data da ocorrência é obrigatório para esta ou futuras ocorrências.");

        if (scope == CalendarEditScope.AllOccurrences || !isRecurring)
        {
            // trata como update normal (tu já tens UpdateEventAsync — podes reutilizar)
            await UpdateEventAsync(
                userId, familyId, eventId,
                title, isAllDay,
                newStartUtc ?? null,
                newEndUtc ?? null,
                participantsAllMembers,
                participantUserIds,
                visibleToAllMembers,
                visibleToUserIds,
                reminderOffsetsMinutes,
                location, note, colorHex,
                recurrenceRule: null,
                recurrenceUntilUtc: null,
                recurrenceCount: null,
                timezoneId,
                ct);

            return;
        }

        if (scope == CalendarEditScope.ThisOccurrence)
        {
            await CreateOrUpdateExceptionAsync(
                userId, familyId, parent,
                occurrenceStartUtc!.Value,
                title, isAllDay, newStartUtc, newEndUtc,
                cancelThisOccurrence,
                participantsAllMembers, participantUserIds,
                visibleToAllMembers, visibleToUserIds,
                reminderOffsetsMinutes,
                location, note, colorHex, timezoneId,
                ct);

            return;
        }

        // ThisAndFuture:
        // 1) encurta o pai com UNTIL = occurrenceStartUtc - 1 tick
        // 2) cria novo evento pai a partir da ocorrência, com mesmo RRULE
        var occStart = occurrenceStartUtc!.Value;

        parent.RecurrenceUntilUtc = occStart.AddTicks(-1);
        parent.UpdatedAtUtc = DateTime.UtcNow;

        var duration = parent.EndUtc - parent.StartUtc;
        var newParent = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            Title = title ?? parent.Title,
            IsAllDay = isAllDay ?? parent.IsAllDay,
            StartUtc = newStartUtc ?? occStart,
            EndUtc = newEndUtc ?? (newStartUtc ?? occStart).Add(duration),
            Location = location ?? parent.Location,
            Note = note ?? parent.Note,
            ColorHex = colorHex ?? parent.ColorHex,
            TimezoneId = timezoneId ?? parent.TimezoneId,
            RecurrenceRule = parent.RecurrenceRule,      // mesma regra
            RecurrenceUntilUtc = null,
            RecurrenceCount = null,
            CreatedByUserId = userId,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.CalendarEvents.Add(newParent);

        // copiar participantes/visibilidade/reminders do pai (ou aplicar novos se vierem)
        await CopyLinksFromParentAsync(parent.Id, newParent.Id,
            participantsAllMembers, participantUserIds,
            visibleToAllMembers, visibleToUserIds,
            reminderOffsetsMinutes,
            familyId, ct);

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "calendar:changed", new
        {
            action = "updated",
            scope = "thisAndFuture",
            eventId = parent.Id,
            newEventId = newParent.Id
        }, ct);
    }

    public async Task<CalendarEventExportModel> GetEventExportAsync(
        Guid userId,
        Guid familyId,
        Guid eventId,
        DateTime? occurrenceStartUtc,
        CancellationToken ct)
    {
        await EnsureMemberAsync(userId, familyId, ct);

        // base event (pai) visível para o user
        var baseEvent = await _db.CalendarEvents
            .AsNoTracking()
            .Where(e => e.FamilyId == familyId)
            .Where(e => e.Id == eventId)
            .Where(e => e.ParentEventId == null)
            .Where(e => _db.CalendarEventVisibilities.Any(v => v.EventId == e.Id && v.UserId == userId))
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.IsAllDay,
                e.StartUtc,
                e.EndUtc,
                e.Location,
                e.Note,
                e.CreatedByUserId,
                e.RecurrenceRule
            })
            .FirstOrDefaultAsync(ct);

        if (baseEvent is null)
            throw new KeyNotFoundException("Evento não encontrado (ou não tens permissões).");

        // Organizer
        var organizer = await _db.Users.AsNoTracking()
            .Where(u => u.Id == baseEvent.CreatedByUserId)
            .Select(u => new UserContactModel(u.Id, u.Name, u.Email))
            .FirstAsync(ct);

        // Participants (attendees)
        var participantIds = await _db.CalendarEventParticipants.AsNoTracking()
            .Where(p => p.EventId == baseEvent.Id)
            .Select(p => p.UserId)
            .ToListAsync(ct);

        var attendees = await _db.Users.AsNoTracking()
            .Where(u => participantIds.Contains(u.Id))
            .Select(u => new UserContactModel(u.Id, u.Name, u.Email))
            .ToListAsync(ct);

        // calcular ocorrência
        var start = occurrenceStartUtc ?? baseEvent.StartUtc;
        var duration = baseEvent.EndUtc - baseEvent.StartUtc;
        var end = occurrenceStartUtc.HasValue ? start.Add(duration) : baseEvent.EndUtc;

        // exceção / cancelamento (se for export de ocorrência específica)
        Guid? exceptionId = null;
        bool isCancelled = false;

        if (occurrenceStartUtc.HasValue)
        {
            // Regra: exceção tem ParentEventId == baseEvent.Id e StartUtc == occurrenceStartUtc
            // (se no futuro suportares all-day com DateOnly, ajustamos para comparar por Date)
            var ex = await _db.CalendarEvents.AsNoTracking()
                .Where(x => x.ParentEventId == baseEvent.Id)
                .Where(x => x.RecurrenceIdUtc == occurrenceStartUtc.Value)
                .Select(x => new
                {
                    x.Id,
                    x.IsCancelled,
                    x.Title,
                    x.IsAllDay,
                    x.StartUtc,
                    x.EndUtc,
                    x.Location,
                    x.Note
                })
                .FirstOrDefaultAsync(ct);

            if (ex is not null)
            {
                exceptionId = ex.Id;
                isCancelled = ex.IsCancelled;

                // Se não estiver cancelado, a exceção pode “substituir” campos
                if (!ex.IsCancelled)
                {
                    start = ex.StartUtc;
                    end = ex.EndUtc;
                    return new CalendarEventExportModel(
                        EventId: baseEvent.Id,
                        ExceptionEventId: exceptionId,
                        IsExceptionCancelled: false,
                        Title: ex.Title,
                        IsAllDay: ex.IsAllDay,
                        OccurrenceStartUtc: start,
                        OccurrenceEndUtc: end,
                        Location: ex.Location,
                        Note: ex.Note,
                        Organizer: organizer,
                        Attendees: attendees,
                        RecurrenceIdUtc: occurrenceStartUtc.Value
                    );
                }

                // Cancelado: exportamos com STATUS:CANCELLED
                return new CalendarEventExportModel(
                    EventId: baseEvent.Id,
                    ExceptionEventId: exceptionId,
                    IsExceptionCancelled: true,
                    Title: baseEvent.Title,
                    IsAllDay: baseEvent.IsAllDay,
                    OccurrenceStartUtc: start,
                    OccurrenceEndUtc: end,
                    Location: baseEvent.Location,
                    Note: baseEvent.Note,
                    Organizer: organizer,
                    Attendees: attendees,
                    RecurrenceIdUtc: occurrenceStartUtc.Value
                );
            }
        }

        return new CalendarEventExportModel(
            EventId: baseEvent.Id,
            ExceptionEventId: null,
            IsExceptionCancelled: false,
            Title: baseEvent.Title,
            IsAllDay: baseEvent.IsAllDay,
            OccurrenceStartUtc: start,
            OccurrenceEndUtc: end,
            Location: baseEvent.Location,
            Note: baseEvent.Note,
            Organizer: organizer,
            Attendees: attendees,
            RecurrenceIdUtc: occurrenceStartUtc
        );
    }


    // --- Helpers ---

    private async Task<FamilyRole> EnsureMemberAsync(Guid userId, Guid familyId, CancellationToken ct)
    {
        var role = await _db.FamilyMembers
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.FamilyId == familyId)
            .Select(m => (FamilyRole?)m.Role)
            .FirstOrDefaultAsync(ct);

        if (role is null) throw new UnauthorizedAccessException("Não és membro desta família.");
        return role.Value;
    }

    private static void EnsureNotViewer(FamilyRole role)
    {
        if (role == FamilyRole.Viewer)
            throw new UnauthorizedAccessException("Sem permissões para editar.");
    }

    private async Task CreateOrUpdateExceptionAsync(
    Guid userId,
    Guid familyId,
    CalendarEvent parent,
    DateTime occurrenceStartUtc,
    string? title,
    bool? isAllDay,
    DateTime? newStartUtc,
    DateTime? newEndUtc,
    bool? cancelThisOccurrence,
    bool? participantsAllMembers,
    IReadOnlyList<Guid>? participantUserIds,
    bool? visibleToAllMembers,
    IReadOnlyList<Guid>? visibleToUserIds,
    IReadOnlyList<int>? reminderOffsetsMinutes,
    string? location,
    string? note,
    string? colorHex,
    string? timezoneId,
    CancellationToken ct)
    {
        var existing = await _db.CalendarEvents
            .FirstOrDefaultAsync(e => e.ParentEventId == parent.Id && e.RecurrenceIdUtc == occurrenceStartUtc, ct);

        var duration = parent.EndUtc - parent.StartUtc;
        var now = DateTime.UtcNow;

        if (existing is null)
        {
            existing = new CalendarEvent
            {
                Id = Guid.NewGuid(),
                FamilyId = familyId,
                ParentEventId = parent.Id,
                RecurrenceIdUtc = occurrenceStartUtc,
                RecurrenceRule = null,
                RecurrenceUntilUtc = null,
                RecurrenceCount = null,
                CreatedByUserId = userId,
                CreatedAtUtc = now
            };
            _db.CalendarEvents.Add(existing);
        }

        // cancelar ocorrência
        if (cancelThisOccurrence == true)
        {
            existing.IsCancelled = true;
            existing.Title = parent.Title;
            existing.IsAllDay = parent.IsAllDay;
            existing.StartUtc = occurrenceStartUtc;
            existing.EndUtc = occurrenceStartUtc.Add(duration);
            existing.Location = parent.Location;
            existing.Note = parent.Note;
            existing.ColorHex = parent.ColorHex;
            existing.TimezoneId = parent.TimezoneId;

        }
        else
        {
            existing.IsCancelled = false;
            existing.Title = (title ?? parent.Title).Trim();
            existing.IsAllDay = isAllDay ?? parent.IsAllDay;

            var s = newStartUtc ?? occurrenceStartUtc;
            var e = newEndUtc ?? s.Add(duration);

            if (e <= s) throw new ArgumentException("Data de fim tem de ser maior que a data de início.");

            existing.StartUtc = s;
            existing.EndUtc = e;

            existing.Location = location ?? parent.Location;
            existing.Note = note ?? parent.Note;
            existing.ColorHex = colorHex ?? parent.ColorHex;
            existing.TimezoneId = timezoneId ?? parent.TimezoneId;
        }

        existing.UpdatedAtUtc = now;

        await CopyLinksFromParentAsync(parent.Id, existing.Id,
            participantsAllMembers, participantUserIds,
            visibleToAllMembers, visibleToUserIds,
            reminderOffsetsMinutes,
            familyId, ct);

        await _db.SaveChangesAsync(ct);

        await _rt.NotifyFamilyAsync(familyId, "calendar:changed", new
        {
            action = "updated",
            scope = "thisOccurrence",
            eventId = parent.Id,
            occurrenceStartUtc = occurrenceStartUtc
        }, ct);
    }

    private async Task CopyLinksFromParentAsync(
        Guid parentId,
        Guid targetEventId,
        bool? participantsAllMembers,
        IReadOnlyList<Guid>? participantUserIds,
        bool? visibleToAllMembers,
        IReadOnlyList<Guid>? visibleToUserIds,
        IReadOnlyList<int>? reminderOffsetsMinutes,
        Guid familyId,
        CancellationToken ct)
    {
        // limpar links atuais do target
        await _db.CalendarEventParticipants.Where(x => x.EventId == targetEventId).ExecuteDeleteAsync(ct);
        await _db.CalendarEventVisibilities.Where(x => x.EventId == targetEventId).ExecuteDeleteAsync(ct);
        await _db.CalendarEventReminders.Where(x => x.EventId == targetEventId).ExecuteDeleteAsync(ct);

        var now = DateTime.UtcNow;

        // members
        var memberIds = await _db.FamilyMembers.AsNoTracking()
            .Where(m => m.FamilyId == familyId)
            .Select(m => m.UserId)
            .ToListAsync(ct);

        // PARTICIPANTS
        IReadOnlyList<Guid> participantsFinal;
        if (participantsAllMembers == true) participantsFinal = memberIds;
        else if (participantUserIds is not null) participantsFinal = participantUserIds.Distinct().ToList();
        else
        {
            participantsFinal = await _db.CalendarEventParticipants.AsNoTracking()
                .Where(x => x.EventId == parentId)
                .Select(x => x.UserId)
                .ToListAsync(ct);
        }

        if (participantsFinal.Count == 0) throw new ArgumentException("Seleciona pelo menos 1 participante.");
        if (participantsFinal.Any(id => !memberIds.Contains(id))) throw new ArgumentException("Participante inválido para esta família.");

        foreach (var uid in participantsFinal)
            _db.CalendarEventParticipants.Add(new CalendarEventParticipant { Id = Guid.NewGuid(), EventId = targetEventId, UserId = uid, CreatedAtUtc = now });

        // VISIBILITY
        IReadOnlyList<Guid> visibleFinal;
        if (visibleToAllMembers == true) visibleFinal = memberIds;
        else if (visibleToUserIds is not null) visibleFinal = visibleToUserIds.Distinct().ToList();
        else
        {
            visibleFinal = await _db.CalendarEventVisibilities.AsNoTracking()
                .Where(x => x.EventId == parentId)
                .Select(x => x.UserId)
                .ToListAsync(ct);
        }

        if (visibleFinal.Count == 0) throw new ArgumentException("Seleciona pelo menos 1 pessoa para ver.");
        if (visibleFinal.Any(id => !memberIds.Contains(id))) throw new ArgumentException("Visibilidade inválida para esta família.");

        foreach (var uid in visibleFinal)
            _db.CalendarEventVisibilities.Add(new CalendarEventVisibility { Id = Guid.NewGuid(), EventId = targetEventId, UserId = uid, CreatedAtUtc = now });

        // REMINDERS
        IReadOnlyList<int> remindersFinal;
        if (reminderOffsetsMinutes is not null)
            remindersFinal = reminderOffsetsMinutes.Distinct().ToList();
        else
            remindersFinal = await _db.CalendarEventReminders.AsNoTracking()
                .Where(x => x.EventId == parentId)
                .Select(x => x.OffsetMinutes)
                .ToListAsync(ct);

        if (remindersFinal.Any(x => x < 0)) throw new ArgumentException("Reminder inválido.");

        foreach (var off in remindersFinal.Distinct())
            _db.CalendarEventReminders.Add(new CalendarEventReminder { Id = Guid.NewGuid(), EventId = targetEventId, OffsetMinutes = off, CreatedAtUtc = now });
    }

}
