namespace DomusUnify.Application.Calendar.Models;

public sealed record CalendarEventDetailModel(
    Guid Id,
    Guid FamilyId,
    string Title,
    bool IsAllDay,
    DateTime StartUtc,
    DateTime EndUtc,
    string? Location,
    string? Note,
    string? ColorHex,
    string? RecurrenceRule,
    DateTime? RecurrenceUntilUtc,
    int? RecurrenceCount,
    string? TimezoneId,
    Guid CreatedByUserId,
    string CreatedByName,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    IReadOnlyList<Guid> ParticipantUserIds,
    IReadOnlyList<Guid> VisibleToUserIds,
    IReadOnlyList<int> ReminderOffsetsMinutes
);
