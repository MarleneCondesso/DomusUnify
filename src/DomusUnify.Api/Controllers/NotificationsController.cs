using DomusUnify.Api.DTOs.Activity;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Activity.Models;
using DomusUnify.Application.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints de notificações (não vistas) da família atual.
/// </summary>
[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public sealed class NotificationsController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly INotificationService _notifications;

    public NotificationsController(ICurrentUserContext ctx, INotificationService notifications)
    {
        _ctx = ctx;
        _notifications = notifications;
    }

    /// <summary>
    /// Obtém notificações não vistas do utilizador na família atual.
    /// </summary>
    /// <remarks>
    /// As notificações são baseadas no feed de atividade e filtradas por visibilidade.
    /// </remarks>
    /// <param name="take">Número máximo a devolver (por defeito 50).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de notificações (entradas de atividade não vistas).</returns>
    [HttpGet("unread")]
    public async Task<ActionResult<List<ActivityEntryResponse>>> GetUnread([FromQuery] int take = 50, CancellationToken ct = default)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var rows = await _notifications.GetUnreadAsync(_ctx.UserId, familyId, take, ct);
        return Ok(rows.Select(ToResponse).ToList());
    }

    /// <summary>
    /// Marca todas as notificações como vistas.
    /// </summary>
    /// <remarks>
    /// Atualiza o marcador interno (<c>LastSeenAtUtc</c>) para a data/hora atual.
    /// </remarks>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpPost("mark-all-seen")]
    public async Task<IActionResult> MarkAllSeen(CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        await _notifications.MarkAllSeenAsync(_ctx.UserId, familyId, ct);
        return NoContent();
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

