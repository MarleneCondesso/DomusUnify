namespace DomusUnify.Application.Calendar.Models;

public sealed record CalendarOccurrence(
    Guid EventId,                 // id do evento pai (ou do evento não recorrente)
    Guid? ExceptionEventId,       // se esta ocorrência vier de uma exceção (update/cancel)
    DateTime OccurrenceStartUtc,  // start da ocorrência
    DateTime OccurrenceEndUtc,    // end da ocorrência
    bool IsCancelled
);
