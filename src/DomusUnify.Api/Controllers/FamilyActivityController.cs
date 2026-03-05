using DomusUnify.Api.DTOs.Activity;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Activity;
using DomusUnify.Application.Activity.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints do feed de atividade para uma famÃ­lia especÃ­fica.
/// </summary>
[ApiController]
[Route("api/v1/families/{familyId:guid}/activity")]
[Authorize]
public sealed class FamilyActivityController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IActivityService _activity;

    public FamilyActivityController(ICurrentUserContext ctx, IActivityService activity)
    {
        _ctx = ctx;
        _activity = activity;
    }

    /// <summary>
    /// ObtÃ©m as entradas mais recentes do feed de atividade.
    /// </summary>
    /// <param name="familyId">Identificador da famÃ­lia.</param>
    /// <param name="take">NÃºmero de entradas a devolver (por defeito 4).</param>
    /// <param name="ct">Token de cancelamento.</param>
    [HttpGet("recent")]
    public async Task<ActionResult<List<ActivityEntryResponse>>> GetRecent(
        Guid familyId,
        [FromQuery] int take = 4,
        CancellationToken ct = default)
    {
        var rows = await _activity.GetRecentAsync(_ctx.UserId, familyId, take, ct);
        return Ok(rows.Select(ToResponse).ToList());
    }

    /// <summary>
    /// ObtÃ©m entradas do feed de atividade (paginado).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<ActivityEntryResponse>>> GetAll(
        Guid familyId,
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

