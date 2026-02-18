using DomusUnify.Application.Calendar.Models;
using DomusUnify.Domain.Entities;

namespace DomusUnify.Application.Calendar;

/// <summary>
/// Serviço responsável por expandir eventos recorrentes em ocorrências concretas.
/// </summary>
/// <remarks>
/// Interpreta a regra de recorrência (<c>RRULE</c>) associada ao evento e devolve as ocorrências que intersectam o
/// intervalo pedido, considerando exceções (instâncias alteradas/canceladas).
/// </remarks>
public interface IRecurrenceService
{
    /// <summary>
    /// Expande um evento (recorrente ou não) em ocorrências dentro de um intervalo temporal.
    /// </summary>
    /// <remarks>
    /// Se <paramref name="parent"/> não tiver regra de recorrência, devolve no máximo uma ocorrência (o próprio
    /// evento) caso o intervalo do evento intersete <paramref name="fromUtc"/>/<paramref name="toUtc"/>.
    /// </remarks>
    /// <param name="parent">Evento pai (origem da recorrência).</param>
    /// <param name="exceptions">Lista de eventos de exceção (instâncias alteradas ou canceladas).</param>
    /// <param name="fromUtc">Início do intervalo (UTC).</param>
    /// <param name="toUtc">Fim do intervalo (UTC).</param>
    /// <returns>Lista ordenada de ocorrências dentro do intervalo.</returns>
    IReadOnlyList<CalendarOccurrence> ExpandOccurrences(
        CalendarEvent parent,
        IReadOnlyList<CalendarEvent> exceptions,
        DateTime fromUtc,
        DateTime toUtc);
}
