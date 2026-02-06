using DomusUnify.Api.DTOs.Calendar;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Calendar;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DomusUnify.Application.Recurrence;

namespace DomusUnify.Api.Controllers;

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
    /// Podes filtrar por:
    /// - dateUtc (dia inteiro, UTC)
    /// - intervalo (fromUtc/toUtc)
    /// - search (parte do título)
    /// - participantUserId (participante específico)
    ///
    /// Se nenhum filtro for fornecido, devolve uma janela default (ex: últimos 7 dias + próximos 30).
    /// </remarks>
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
    /// Deletes a calendar event.
    /// </summary>
    /// <param name="eventId">The ID of the event to delete.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>No content if successful.</returns>
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
    /// Copies a calendar event to multiple specified dates.
    /// </summary>
    /// <param name="eventId">The ID of the event to copy.</param>
    /// <param name="request">The request containing the list of dates to copy to.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>A list of copied calendar event responses.</returns>
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

}
