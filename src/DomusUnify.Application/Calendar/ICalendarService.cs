using DomusUnify.Application.Calendar.Models;
using DomusUnify.Application.Recurrence;

namespace DomusUnify.Application.Calendar;

public interface ICalendarService
{
    Task<IReadOnlyList<CalendarEventInstanceModel>> GetEventsAsync(
        Guid userId,
        Guid familyId,
        DateTime? fromUtc,
        DateTime? toUtc,
        DateTime? dateUtc,
        string? search,
        Guid? participantUserId,
        CancellationToken ct);

    Task<CalendarEventModel> GetEventByIdAsync(Guid userId, Guid familyId, Guid eventId, CancellationToken ct);


    Task<CalendarEventModel> CreateEventAsync(
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
        CancellationToken ct);


    Task<CalendarEventModel> UpdateEventAsync(
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
        CancellationToken ct);

    Task DeleteEventAsync(Guid userId, Guid familyId, Guid eventId, CancellationToken ct);

    Task<CalendarEventModel> DuplicateEventAsync(
        Guid userId, Guid familyId, Guid eventId, DateTime newStartUtc, DateTime newEndUtc, CancellationToken ct);

    Task<IReadOnlyList<CalendarEventModel>> CopyEventToDatesAsync(
        Guid userId, Guid familyId, Guid eventId, IReadOnlyList<DateOnly> datesUtc, CancellationToken ct);

    Task UpdateRecurringEventAsync(
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
        CancellationToken ct);

}
