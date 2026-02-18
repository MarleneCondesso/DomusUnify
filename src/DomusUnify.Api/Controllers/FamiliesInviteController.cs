using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Family;

namespace DomusUnify.Api.Controllers;

[ApiController]
[Route("api/v1/families/invites")]
[Authorize]
public sealed class FamilyInvitesController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IFamilyInviteService _inviteService;

    public FamilyInvitesController(ICurrentUserContext ctx, IFamilyInviteService svc)
    {
        _ctx = ctx;
        _inviteService = svc;
    }

    [HttpGet("preview")]
    public async Task<ActionResult<InvitePreviewModel>> Preview([FromQuery] string token, CancellationToken ct)
        => Ok(await _inviteService.PreviewInviteAsync(_ctx.UserId, token, ct));

    public sealed record JoinInviteRequest(string Token);

    [HttpPost("join")]
    public async Task<IActionResult> Join([FromBody] JoinInviteRequest req, CancellationToken ct)
    {
        await _inviteService.JoinByInviteAsync(_ctx.UserId, req.Token, ct);
        return NoContent();
    }
}
