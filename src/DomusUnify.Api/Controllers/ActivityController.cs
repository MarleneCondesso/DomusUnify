using DomusUnify.Api.DTOs.Activity;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Activity;
using DomusUnify.Application.Activity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints do feed de atividade (Recent Updates / All Activity) da família atual.
/// </summary>
[ApiController]
[Route("api/v1/activity")]
[Authorize]
public sealed class ActivityController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IActivityService _activity;

    public ActivityController(ICurrentUserContext ctx, IActivityService activity)
    {
        _ctx = ctx;
        _activity = activity;
    }

    /// <summary>
    /// Obtém as entradas mais recentes do feed de atividade.
    /// </summary>
    /// <remarks>
    /// Útil para o cartão "Recent Updates" no dashboard (ex.: os primeiros 4 updates).
    /// </remarks>
    /// <param name="take">Número de entradas a devolver (por defeito 4).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de entradas de atividade.</returns>
    [HttpGet("recent")]
    public async Task<ActionResult<List<ActivityEntryResponse>>> GetRecent([FromQuery] int take = 4, CancellationToken ct = default)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var rows = await _activity.GetRecentAsync(_ctx.UserId, familyId, take, ct);
        return Ok(rows.Select(ToResponse).ToList());
    }

    /// <summary>
    /// Obtém entradas do feed de atividade (paginado).
    /// </summary>
    /// <remarks>
    /// Útil para "View All Activity".
    /// </remarks>
    /// <param name="skip">Número de registos a saltar (por defeito 0).</param>
    /// <param name="take">Número de registos a devolver (por defeito 50).</param>
    /// <param name="type">
    /// Filtro opcional por tipo/área.
    /// Valores suportados: <c>lists</c>, <c>budget</c>, <c>calendar</c>.
    /// </param>
    /// <param name="fromUtc">Filtro opcional por data/hora inicial (UTC).</param>
    /// <param name="toUtc">Filtro opcional por data/hora final (UTC, exclusivo).</param>
    /// <param name="dateUtc">Filtro opcional por dia inteiro (UTC). Não pode ser usado em conjunto com <paramref name="fromUtc"/>/<paramref name="toUtc"/>.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de entradas de atividade.</returns>
    [HttpGet]
    public async Task<ActionResult<List<ActivityEntryResponse>>> GetAll(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50,
        [FromQuery] string? type = null,
        [FromQuery] DateTime? fromUtc = null,
        [FromQuery] DateTime? toUtc = null,
        [FromQuery] DateOnly? dateUtc = null,
        CancellationToken ct = default)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

            var rows = await _activity.GetAsync(_ctx.UserId, familyId, skip, take, type, fromUtc, toUtc, dateUtc, ct);
            return Ok(rows.Select(ToResponse).ToList());
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    private static ActivityEntryResponse ToResponse(ActivityEntryModel x) => new()
    {
        Id = x.Id,
        Kind = x.Kind,
        Message = x.Message,
        ActorUserId = x.ActorUserId,
        ActorName = x.ActorName,
        CreatedAtUtc = x.CreatedAtUtc,
        ListId = x.ListId,
        EntityId = x.EntityId
    };
}
