namespace DomusUnify.Application.Calendar.Models;

/// <summary>
/// Representa uma ocorrência concreta de um evento (inclui exceções e cancelamentos).
/// </summary>
/// <param name="EventId">Identificador do evento pai (ou do evento não recorrente).</param>
/// <param name="ExceptionEventId">Identificador da exceção que originou esta ocorrência, se aplicável.</param>
/// <param name="OccurrenceStartUtc">Início da ocorrência (UTC).</param>
/// <param name="OccurrenceEndUtc">Fim da ocorrência (UTC).</param>
/// <param name="IsCancelled">Indica se a ocorrência está cancelada.</param>
public sealed record CalendarOccurrence(
    Guid EventId,                 // id do evento pai (ou do evento não recorrente)
    Guid? ExceptionEventId,       // se esta ocorrência vier de uma exceção (update/cancel)
    DateTime OccurrenceStartUtc,  // start da ocorrência
    DateTime OccurrenceEndUtc,    // end da ocorrência
    bool IsCancelled
);
