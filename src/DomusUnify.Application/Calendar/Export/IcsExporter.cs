using System.Text;
using DomusUnify.Application.Calendar.Models;

namespace DomusUnify.Application.Calendar.Export;

/// <summary>
/// Exportador de eventos de calendário para o formato iCalendar (<c>.ics</c>).
/// </summary>
public static class IcsExporter
{
    /// <summary>
    /// Gera o conteúdo <c>.ics</c> para um evento/ocorrência.
    /// </summary>
    /// <param name="e">Modelo de exportação do evento.</param>
    /// <returns>Conteúdo iCalendar pronto a ser gravado num ficheiro <c>.ics</c>.</returns>
    public static string Generate(CalendarEventExportModel e)
    {
        var sb = new StringBuilder();

        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//DomusUnify//Calendar//PT");
        sb.AppendLine("CALSCALE:GREGORIAN");
        sb.AppendLine("METHOD:PUBLISH");

        sb.AppendLine("BEGIN:VEVENT");

        var uid = e.ExceptionEventId is not null
            ? $"{e.ExceptionEventId}@domusunify"
            : $"{e.EventId}@domusunify";

        sb.AppendLine($"UID:{uid}");

        if (e.IsExceptionCancelled)
        {
            sb.AppendLine("STATUS:CANCELLED");
        }

        sb.AppendLine($"DTSTAMP:{UtcNow()}");

        if (e.IsAllDay)
        {
            sb.AppendLine($"DTSTART;VALUE=DATE:{DateOnly(e.OccurrenceStartUtc)}");
            sb.AppendLine($"DTEND;VALUE=DATE:{DateOnly(e.OccurrenceEndUtc)}");
        }
        else
        {
            sb.AppendLine($"DTSTART:{Utc(e.OccurrenceStartUtc)}");
            sb.AppendLine($"DTEND:{Utc(e.OccurrenceEndUtc)}");
        }

        if (e.RecurrenceIdUtc.HasValue)
        {
            sb.AppendLine($"RECURRENCE-ID:{Utc(e.RecurrenceIdUtc.Value)}");
        }

        sb.AppendLine($"SUMMARY:{Escape(e.Title)}");

        if (!string.IsNullOrWhiteSpace(e.Location))
            sb.AppendLine($"LOCATION:{Escape(e.Location)}");

        if (!string.IsNullOrWhiteSpace(e.Note))
            sb.AppendLine($"DESCRIPTION:{Escape(e.Note)}");

        sb.AppendLine($"ORGANIZER;CN={Escape(e.Organizer.Name)}:MAILTO:{e.Organizer.Email}");

        foreach (var a in e.Attendees)
        {
            sb.AppendLine($"ATTENDEE;CN={Escape(a.Name)};ROLE=REQ-PARTICIPANT:MAILTO:{a.Email}");
        }

        sb.AppendLine("END:VEVENT");
        sb.AppendLine("END:VCALENDAR");

        return sb.ToString();
    }

    // ---------- helpers ----------

    private static string Utc(DateTime dt) =>
        dt.ToUniversalTime().ToString("yyyyMMdd'T'HHmmss'Z'");

    private static string DateOnly(DateTime dt) =>
        dt.ToUniversalTime().ToString("yyyyMMdd");

    private static string UtcNow() =>
        DateTime.UtcNow.ToString("yyyyMMdd'T'HHmmss'Z'");

    private static string Escape(string value) =>
        value
            .Replace("\\", "\\\\")
            .Replace(";", "\\;")
            .Replace(",", "\\,")
            .Replace("\n", "\\n");
}
