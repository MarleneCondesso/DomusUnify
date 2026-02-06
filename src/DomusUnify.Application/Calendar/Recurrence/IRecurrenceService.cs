using DomusUnify.Application.Calendar.Models;
using DomusUnify.Domain.Entities;

namespace DomusUnify.Application.Calendar;

public interface IRecurrenceService
{
    IReadOnlyList<CalendarOccurrence> ExpandOccurrences(
        CalendarEvent parent,
        IReadOnlyList<CalendarEvent> exceptions,
        DateTime fromUtc,
        DateTime toUtc);
}
