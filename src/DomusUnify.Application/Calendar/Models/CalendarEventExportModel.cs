namespace DomusUnify.Application.Calendar.Models;

public sealed record CalendarEventExportModel(
    Guid EventId,
    Guid? ExceptionEventId,
    bool IsExceptionCancelled,

    string Title,
    bool IsAllDay,
    DateTime OccurrenceStartUtc,
    DateTime OccurrenceEndUtc,

    string? Location,
    string? Note,

    UserContactModel Organizer,
    IReadOnlyList<UserContactModel> Attendees,

    // se for recorrente e estivermos a exportar uma ocorrência específica
    DateTime? RecurrenceIdUtc
);
 