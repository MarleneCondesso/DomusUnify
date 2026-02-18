using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Family;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints para convites de família (pré-visualização e adesão).
/// </summary>
/// <remarks>
/// Permite ao utilizador autenticar-se e juntar-se a uma família através de um token de convite.
/// </remarks>
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

    /// <summary>
    /// Pré-visualiza um convite de família.
    /// </summary>
    /// <remarks>
    /// Útil para mostrar ao utilizador a que família pertence o token antes de confirmar a adesão.
    /// </remarks>
    /// <param name="token">Token do convite.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Informação de pré-visualização do convite.</returns>
    [HttpGet("preview")]
    public async Task<ActionResult<InvitePreviewModel>> Preview([FromQuery] string token, CancellationToken ct)
        => Ok(await _inviteService.PreviewInviteAsync(_ctx.UserId, token, ct));

    /// <summary>
    /// Pedido para aderir a uma família através de convite.
    /// </summary>
    /// <param name="Token">Token do convite.</param>
    public sealed record JoinInviteRequest(string Token);

    /// <summary>
    /// Junta o utilizador autenticado à família associada ao token.
    /// </summary>
    /// <remarks>
    /// Se o token for inválido/expirado ou exceder o número máximo de utilizações, devolve erro.
    /// </remarks>
    /// <param name="req">Pedido com o token do convite.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se a adesão for bem-sucedida.</returns>
    [HttpPost("join")]
    public async Task<IActionResult> Join([FromBody] JoinInviteRequest req, CancellationToken ct)
    {
        await _inviteService.JoinByInviteAsync(_ctx.UserId, req.Token, ct);
        return NoContent();
    }
}
