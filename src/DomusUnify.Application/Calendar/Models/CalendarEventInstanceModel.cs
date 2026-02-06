namespace DomusUnify.Application.Calendar.Models;

public sealed record CalendarEventInstanceModel(
    Guid EventId,                 // evento pai ou evento único
    Guid? ExceptionEventId,       // se for exceção
    DateTime OccurrenceStartUtc,
    DateTime OccurrenceEndUtc,

    // dados “renderizáveis”
    string Title,
    bool IsAllDay,
    string? Location,
    string? Note,
    string? ColorHex,
    string? TimezoneId,

    Guid FamilyId,

    Guid CreatedByUserId,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,

    IReadOnlyList<Guid> ParticipantUserIds,
    IReadOnlyList<Guid> VisibleToUserIds,
    IReadOnlyList<int> ReminderOffsetsMinutes,

    bool IsCancelled
);
