using DomusUnify.Api.DTOs.Calendar;
using DomusUnify.Application.Calendar.Models;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Calendar;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DomusUnify.Application.Recurrence;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints do módulo de calendário para a família atual.
/// </summary>
[ApiController]
[Route("api/v1/calendar")]
[Authorize]
public sealed class CalendarController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly ICalendarService _cal;

    public CalendarController(ICurrentUserContext ctx, ICalendarService cal)
    {
        _ctx = ctx;
        _cal = cal;
    }

    /// <summary>
    /// Lista eventos do calendário visíveis para o utilizador autenticado.
    /// </summary>
    /// <remarks>
    /// Pode filtrar por:
    /// - dateUtc (dia inteiro, UTC)
    /// - intervalo (fromUtc/toUtc)
    /// - search (parte do título)
    /// - participantUserId (participante específico)
    ///
    /// Se nenhum filtro for fornecido, devolve uma janela default (ex: últimos 7 dias + próximos 30).
    /// </remarks>
    /// <param name="fromUtc">Data/hora inicial (UTC) para filtrar por intervalo, opcional.</param>
    /// <param name="toUtc">Data/hora final (UTC) para filtrar por intervalo, opcional.</param>
    /// <param name="dateUtc">Dia (UTC) para filtrar por dia inteiro, opcional.</param>
    /// <param name="search">Texto para procurar no título, opcional.</param>
    /// <param name="participantUserId">Filtra por participante específico, opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de respostas de eventos do calendário.</returns>
    // GET api/v1/calendar/events?dateUtc=2026-02-04&search=...&participantUserId=...
    [HttpGet("events")]
    public async Task<ActionResult<List<CalendarEventResponse>>> GetEvents(
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] DateOnly? dateUtc,
        [FromQuery] string? search,
        [FromQuery] Guid? participantUserId,
        CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        // DateOnly -> DateTime UTC (dia inteiro)
        DateTime? dateAsUtc = dateUtc.HasValue
            ? dateUtc.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc)
            : null;

        var data = await _cal.GetEventsAsync(_ctx.UserId, familyId, fromUtc, toUtc, dateAsUtc, search, participantUserId, ct);

        return Ok(data.Select(e => new CalendarEventResponse
        {
            Id = e.EventId,
            ExceptionEventId = e.ExceptionEventId,
            Title = e.Title,
            IsAllDay = e.IsAllDay,
            StartUtc = e.OccurrenceStartUtc,
            EndUtc = e.OccurrenceEndUtc,
            Location = e.Location,
            Note = e.Note,
            ColorHex = e.ColorHex,
            TimezoneId = e.TimezoneId,
            CreatedByUserId = e.CreatedByUserId,
            CreatedAtUtc = e.CreatedAtUtc,
            UpdatedAtUtc = e.UpdatedAtUtc,
            ParticipantUserIds = e.ParticipantUserIds.ToList(),
            VisibleToUserIds = e.VisibleToUserIds.ToList(),
            ReminderOffsetsMinutes = e.ReminderOffsetsMinutes.ToList()
        }).ToList());
    }


    /// <summary>
    /// Devolve os detalhes de um evento do calendário pelo seu ID.
    /// </summary>
    /// <remarks>
    /// Retorna <c>404 Not Found</c> se o evento não existir ou não for visível para o utilizador autenticado na família atual.
    /// </remarks>
    /// <param name="eventId">O ID do evento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Os detalhes do evento.</returns>
    // GET api/v1/calendar/events/{eventId}
    [HttpGet("events/{eventId:guid}")]
    public async Task<ActionResult<CalendarEventDetailResponse>> GetEventById(Guid eventId, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        try
        {
            var e = await _cal.GetEventByIdAsync(_ctx.UserId, familyId, eventId, ct);

            return Ok(new CalendarEventDetailResponse
            {
                Id = e.Id,
                FamilyId = e.FamilyId,
                Title = e.Title,
                IsAllDay = e.IsAllDay,
                StartUtc = e.StartUtc,
                EndUtc = e.EndUtc,
                Location = e.Location,
                Note = e.Note,
                ColorHex = e.ColorHex,
                TimezoneId = e.TimezoneId,
                RecurrenceRule = e.RecurrenceRule,
                RecurrenceUntilUtc = e.RecurrenceUntilUtc,
                RecurrenceCount = e.RecurrenceCount,
                CreatedByUserId = e.CreatedByUserId,
                CreatedByName = e.CreatedByName,
                CreatedAtUtc = e.CreatedAtUtc,
                UpdatedAtUtc = e.UpdatedAtUtc,
                ParticipantUserIds = e.ParticipantUserIds.ToList(),
                VisibleToUserIds = e.VisibleToUserIds.ToList(),
                ReminderOffsetsMinutes = e.ReminderOffsetsMinutes.ToList()
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    /// <summary>
    /// Cria um novo evento do calendário para a família atual.
    /// </summary>
    /// <remarks>
    /// Permite definir participantes, visibilidade, lembretes, recorrência, etc. O utilizador deve ter permissões na família.
    /// </remarks>
    /// <param name="request">O pedido contendo detalhes do evento como título, datas, participantes, etc.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A resposta do evento do calendário criado.</returns>
    [HttpPost("events")]
    public async Task<ActionResult<CalendarEventResponse>> CreateEvent(CreateCalendarEventRequest request, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        try
        {
            var created = await _cal.CreateEventAsync(
                _ctx.UserId,
                familyId,
                request.Title,
                request.IsAllDay,
                request.StartUtc,
                request.EndUtc,
                request.ParticipantUserIds,
                request.ParticipantsAllMembers,
                request.VisibleToUserIds,
                request.VisibleToAllMembers,
                request.ReminderOffsetsMinutes,
                request.Location,
                request.Note,
                request.ColorHex,
                request.RecurrenceRule,
                request.RecurrenceUntilUtc,
                request.RecurrenceCount,
                request.TimezoneId,
                ct);

            return Ok(new CalendarEventResponse
            {
                Id = created.Id,
                Title = created.Title,
                IsAllDay = created.IsAllDay,
                StartUtc = created.StartUtc,
                EndUtc = created.EndUtc,
                Location = created.Location,
                Note = created.Note,
                ColorHex = created.ColorHex,
                RecurrenceRule = created.RecurrenceRule,
                RecurrenceUntilUtc = created.RecurrenceUntilUtc,
                RecurrenceCount = created.RecurrenceCount,
                TimezoneId = created.TimezoneId,
                CreatedByUserId = created.CreatedByUserId,
                CreatedAtUtc = created.CreatedAtUtc,
                UpdatedAtUtc = created.UpdatedAtUtc,
                ParticipantUserIds = created.ParticipantUserIds.ToList(),
                VisibleToUserIds = created.VisibleToUserIds.ToList(),
                ReminderOffsetsMinutes = created.ReminderOffsetsMinutes.ToList()
            });
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Atualiza um evento do calendário existente.
    /// </summary>
    /// <remarks>
    /// Permite alterar título, datas, participantes, etc. O utilizador deve ter permissões para editar o evento.
    /// </remarks>
    /// <param name="eventId">O ID do evento a atualizar.</param>
    /// <param name="request">O pedido contendo detalhes atualizados do evento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A resposta do evento do calendário atualizado.</returns>
    [HttpPatch("events/{eventId:guid}")]
    public async Task<ActionResult<CalendarEventResponse>> UpdateEvent(
        Guid eventId,
        UpdateCalendarEventRequest request,
        CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var updated = await _cal.UpdateEventAsync(
            _ctx.UserId, familyId, eventId,
            request.Title,
            request.IsAllDay,
            request.StartUtc,
            request.EndUtc,
            request.ParticipantsAllMembers,
            request.ParticipantUserIds,
            request.VisibleToAllMembers,
            request.VisibleToUserIds,
            request.ReminderOffsetsMinutes,
            request.Location,
            request.Note,
            request.ColorHex,
            request.RecurrenceRule,
            request.RecurrenceUntilUtc,
            request.RecurrenceCount,
            request.TimezoneId,
            ct);

        return Ok(new CalendarEventResponse
        {
            Id = updated.Id,
            Title = updated.Title,
            IsAllDay = updated.IsAllDay,
            StartUtc = updated.StartUtc,
            EndUtc = updated.EndUtc,
            Location = updated.Location,
            Note = updated.Note,
            ColorHex = updated.ColorHex,
            RecurrenceRule = updated.RecurrenceRule,
            RecurrenceUntilUtc = updated.RecurrenceUntilUtc,
            RecurrenceCount = updated.RecurrenceCount,
            TimezoneId = updated.TimezoneId,
            CreatedByUserId = updated.CreatedByUserId,
            CreatedAtUtc = updated.CreatedAtUtc,
            UpdatedAtUtc = updated.UpdatedAtUtc,
            ParticipantUserIds = updated.ParticipantUserIds.ToList(),
            VisibleToUserIds = updated.VisibleToUserIds.ToList(),
            ReminderOffsetsMinutes = updated.ReminderOffsetsMinutes.ToList()
        });
    }

    /// <summary>
    /// Elimina um evento do calendário.
    /// </summary>
    /// <remarks>
    /// O utilizador deve ter permissões para editar o evento na família atual.
    /// </remarks>
    /// <param name="eventId">O ID do evento a eliminar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpDelete("events/{eventId:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid eventId, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        await _cal.DeleteEventAsync(_ctx.UserId, familyId, eventId, ct);
        return NoContent();
    }

    /// <summary>
    /// Duplica um evento do calendário com novas horas de início e fim.
    /// </summary>
    /// <remarks>
    /// Cria uma cópia do evento com datas ajustadas. O utilizador deve ter permissões na família.
    /// </remarks>
    /// <param name="eventId">O ID do evento a duplicar.</param>
    /// <param name="request">O pedido contendo novas horas de início e fim.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A resposta do evento do calendário duplicado.</returns>
    [HttpPost("events/{eventId:guid}/duplicate")]
    public async Task<ActionResult<CalendarEventResponse>> DuplicateEvent(
        Guid eventId,
        DuplicateCalendarEventRequest request,
        CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var created = await _cal.DuplicateEventAsync(
            _ctx.UserId, familyId, eventId, request.NewStartUtc, request.NewEndUtc, ct);

        return Ok(new CalendarEventResponse
        {
            Id = created.Id,
            Title = created.Title,
            IsAllDay = created.IsAllDay,
            StartUtc = created.StartUtc,
            EndUtc = created.EndUtc,
            Location = created.Location,
            Note = created.Note,
            ColorHex = created.ColorHex,
            RecurrenceRule = created.RecurrenceRule,
            RecurrenceUntilUtc = created.RecurrenceUntilUtc,
            RecurrenceCount = created.RecurrenceCount,
            TimezoneId = created.TimezoneId,
            CreatedByUserId = created.CreatedByUserId,
            CreatedAtUtc = created.CreatedAtUtc,
            UpdatedAtUtc = created.UpdatedAtUtc,
            ParticipantUserIds = created.ParticipantUserIds.ToList(),
            VisibleToUserIds = created.VisibleToUserIds.ToList(),
            ReminderOffsetsMinutes = created.ReminderOffsetsMinutes.ToList()
        });
    }

    /// <summary>
    /// Copia um evento do calendário para várias datas.
    /// </summary>
    /// <remarks>
    /// Cria novas instâncias do evento nas datas indicadas (UTC).
    /// </remarks>
    /// <param name="eventId">O ID do evento a copiar.</param>
    /// <param name="request">Pedido com a lista de datas para onde copiar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista com os eventos copiados.</returns>
    [HttpPost("events/{eventId:guid}/copy")]
    public async Task<ActionResult<List<CalendarEventResponse>>> CopyEvent(
        Guid eventId,
        CopyCalendarEventRequest request,
        CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var created = await _cal.CopyEventToDatesAsync(
            _ctx.UserId, familyId, eventId, request.DatesUtc, ct);

        return Ok(created.Select(e => new CalendarEventResponse
        {
            Id = e.Id,
            Title = e.Title,
            IsAllDay = e.IsAllDay,
            StartUtc = e.StartUtc,
            EndUtc = e.EndUtc,
            Location = e.Location,
            Note = e.Note,
            ColorHex = e.ColorHex,
            RecurrenceRule = e.RecurrenceRule,
            RecurrenceUntilUtc = e.RecurrenceUntilUtc,
            RecurrenceCount = e.RecurrenceCount,
            TimezoneId = e.TimezoneId,
            CreatedByUserId = e.CreatedByUserId,
            CreatedAtUtc = e.CreatedAtUtc,
            UpdatedAtUtc = e.UpdatedAtUtc,
            ParticipantUserIds = e.ParticipantUserIds.ToList(),
            VisibleToUserIds = e.VisibleToUserIds.ToList(),
            ReminderOffsetsMinutes = e.ReminderOffsetsMinutes.ToList()
        }).ToList());
    }

    /// <summary>
    /// Atualiza um evento recorrente do calendário.
    /// </summary>
    /// <remarks>
    /// Permite editar a série recorrente ou uma ocorrência específica. O scope define se é toda a série ou apenas uma ocorrência.
    /// </remarks>
    /// <param name="eventId">O ID do evento recorrente.</param>
    /// <param name="request">O pedido contendo detalhes da atualização recorrente.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpPatch("events/{eventId:guid}/recurrence")]
    public async Task<IActionResult> UpdateRecurring(
        Guid eventId,
        UpdateRecurringEventRequest request,
        CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        await _cal.UpdateRecurringEventAsync(
            _ctx.UserId,
            familyId,
            eventId,
            (CalendarEditScope)request.Scope,
            request.OccurrenceStartUtc,
            request.Title,
            request.IsAllDay,
            request.NewStartUtc,
            request.NewEndUtc,
            request.CancelThisOccurrence,
            request.ParticipantsAllMembers,
            request.ParticipantUserIds,
            request.VisibleToAllMembers,
            request.VisibleToUserIds,
            request.ReminderOffsetsMinutes,
            request.Location,
            request.Note,
            request.ColorHex,
            request.TimezoneId,
            ct);

        return NoContent();
    }

    /// <summary>
    /// Exporta um evento do calendário para um ficheiro ICS (iCalendar).
    /// </summary>
    /// <remarks>
    /// Para eventos recorrentes, podes especificar <paramref name="occurrenceStartUtc"/> para exportar uma ocorrência específica.
    /// Retorna <c>404 Not Found</c> se o evento não existir ou não for visível para o utilizador autenticado na família atual.
    /// </remarks>
    /// <param name="eventId">O ID do evento a exportar.</param>
    /// <param name="occurrenceStartUtc">Hora de início (UTC) de uma ocorrência específica (opcional).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Um ficheiro ICS contendo os detalhes do evento.</returns>
    // GET api/v1/calendar/events/{eventId}/export?occurrenceStartUtc=2026-02-04T10:00:00Z
    [HttpGet("events/{eventId:guid}/export")]
    public async Task<IActionResult> ExportIcs(
      Guid eventId,
     [FromQuery] DateTime? occurrenceStartUtc,
     CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        CalendarEventExportModel e;
        try
        {
            e = await _cal.GetEventExportAsync(_ctx.UserId, familyId, eventId, occurrenceStartUtc, ct);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }

        var ics = BuildIcsExport(e);

        var safe = string.Join("_", e.Title.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
        if (string.IsNullOrWhiteSpace(safe)) safe = "evento";

        return File(
            System.Text.Encoding.UTF8.GetBytes(ics),
            "text/calendar; charset=utf-8",
            $"{safe}.ics"
        );
    }

    /// <summary>
    /// Constrói uma string ICS (iCalendar) para o evento do calendário, incluindo organizador, participantes e detalhes conforme RFC5545.
    /// </summary>
    /// <param name="e">O modelo de exportação do evento do calendário.</param>
    /// <returns>Uma string formatada em ICS representando o evento com organizador e participantes.</returns>
    private static string BuildIcsExport(CalendarEventExportModel e)
    {
        static string Escape(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return "";
            return s.Replace(@"\", @"\\")
                    .Replace(";", @"\;")
                    .Replace(",", @"\,")
                    .Replace("\r\n", @"\n")
                    .Replace("\n", @"\n")
                    .Trim();
        }

        static string FormatUtc(DateTime dt)
        {
            var utc = dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            return utc.ToString("yyyyMMdd'T'HHmmss'Z'");
        }

        static string FormatDate(DateTime dt) => dt.ToString("yyyyMMdd");

        var uid = $"{e.EventId}@domusunify";
        var dtstamp = FormatUtc(DateTime.UtcNow);

        var lines = new List<string>
    {
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//DomusUnify//Calendar//PT",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:DomusUnify", // ✅
        "BEGIN:VEVENT",
        $"UID:{uid}",
        $"DTSTAMP:{dtstamp}",
        $"SUMMARY:{Escape(e.Title)}"
    };

        // Organizer
        lines.Add($"ORGANIZER;CN={Escape(e.Organizer.Name)}:mailto:{e.Organizer.Email}");

        // Attendees
        foreach (var a in e.Attendees)
        {
            // ROLE opcional; podes ajustar depois (REQ-PARTICIPANT, OPT-PARTICIPANT)
            lines.Add($"ATTENDEE;CN={Escape(a.Name)};ROLE=REQ-PARTICIPANT:mailto:{a.Email}");
        }

        if (!string.IsNullOrWhiteSpace(e.Note))
            lines.Add($"DESCRIPTION:{Escape(e.Note)}"); // Note como descrição

        if (!string.IsNullOrWhiteSpace(e.Location))
            lines.Add($"LOCATION:{Escape(e.Location)}");

        // Recurrence exception identity
        if (e.RecurrenceIdUtc.HasValue)
            lines.Add($"RECURRENCE-ID:{FormatUtc(e.RecurrenceIdUtc.Value)}");

        // Cancelled occurrence
        if (e.IsExceptionCancelled)
            lines.Add("STATUS:CANCELLED");

        // All-day em ICS: DTEND exclusivo (dia seguinte)
        if (e.IsAllDay)
        {
            var d1 = e.OccurrenceStartUtc.Date;
            var d2 = e.OccurrenceEndUtc.Date;
            if (d2 <= d1) d2 = d1.AddDays(1);

            lines.Add($"DTSTART;VALUE=DATE:{FormatDate(d1)}");
            lines.Add($"DTEND;VALUE=DATE:{FormatDate(d2)}");
        }
        else
        {
            lines.Add($"DTSTART:{FormatUtc(e.OccurrenceStartUtc)}");
            lines.Add($"DTEND:{FormatUtc(e.OccurrenceEndUtc)}");
        }

        lines.Add("END:VEVENT");
        lines.Add("END:VCALENDAR");

        return string.Join("\r\n", lines) + "\r\n";
    }

}
