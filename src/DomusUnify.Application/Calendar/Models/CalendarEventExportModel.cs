namespace DomusUnify.Application.Calendar.Models;

/// <summary>
/// Modelo de exportação de um evento/ocorrência (ex.: para <c>.ics</c>).
/// </summary>
/// <param name="EventId">Identificador do evento pai.</param>
/// <param name="ExceptionEventId">Identificador do evento de exceção, se aplicável.</param>
/// <param name="IsExceptionCancelled">Indica se a exceção representa um cancelamento.</param>
/// <param name="Title">Título da ocorrência.</param>
/// <param name="IsAllDay">Indica se é um evento de dia inteiro.</param>
/// <param name="OccurrenceStartUtc">Início da ocorrência (UTC).</param>
/// <param name="OccurrenceEndUtc">Fim da ocorrência (UTC).</param>
/// <param name="Location">Localização (opcional).</param>
/// <param name="Note">Nota/descrição (opcional).</param>
/// <param name="Organizer">Organizador do evento.</param>
/// <param name="Attendees">Lista de participantes/convocados.</param>
/// <param name="RecurrenceIdUtc">Identificador de recorrência (UTC) quando a exportação é de uma ocorrência específica.</param>
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
 
