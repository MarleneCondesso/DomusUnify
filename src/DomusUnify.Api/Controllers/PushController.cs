using System.Security.Cryptography;
using System.Text;
using DomusUnify.Api.DTOs.Push;
using DomusUnify.Api.Push;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Common.Interfaces;
using DomusUnify.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints para gestão de subscrições Web Push.
/// </summary>
[ApiController]
[Route("api/v1/push")]
[Authorize]
public sealed class PushController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IAppDbContext _db;
    private readonly WebPushOptions _options;

    public PushController(
        ICurrentUserContext ctx,
        IAppDbContext db,
        IOptions<WebPushOptions> options)
    {
        _ctx = ctx;
        _db = db;
        _options = options.Value;
    }

    /// <summary>
    /// Devolve a chave pública VAPID usada no browser para subscrever push.
    /// </summary>
    [HttpGet("public-key")]
    public ActionResult<PushPublicKeyResponse> GetPublicKey()
    {
        var publicKey = (_options.PublicKey ?? "").Trim();
        if (string.IsNullOrWhiteSpace(publicKey))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, "Web Push não está configurado.");

        return Ok(new PushPublicKeyResponse { PublicKey = publicKey });
    }

    /// <summary>
    /// Regista ou atualiza uma subscrição Web Push para o utilizador autenticado.
    /// </summary>
    [HttpPut("subscriptions")]
    public async Task<IActionResult> UpsertSubscription(UpsertWebPushSubscriptionRequest request, CancellationToken ct)
    {
        var endpoint = (request.Endpoint ?? "").Trim();
        var p256Dh = (request.P256Dh ?? "").Trim();
        var auth = (request.Auth ?? "").Trim();

        if (string.IsNullOrWhiteSpace(endpoint))
            return BadRequest("Endpoint é obrigatório.");

        var endpointHash = ComputeEndpointHash(endpoint);
        var existing = await _db.WebPushSubscriptions
            .FirstOrDefaultAsync(s => s.EndpointHash == endpointHash, ct);

        if (!request.NotificationsEnabled)
        {
            if (existing is not null)
            {
                _db.WebPushSubscriptions.Remove(existing);
                await _db.SaveChangesAsync(ct);
            }

            return NoContent();
        }

        if (string.IsNullOrWhiteSpace(p256Dh) || string.IsNullOrWhiteSpace(auth))
            return BadRequest("As chaves da subscrição são obrigatórias.");

        var now = DateTime.UtcNow;

        if (existing is null)
        {
            _db.WebPushSubscriptions.Add(new WebPushSubscription
            {
                Id = Guid.NewGuid(),
                UserId = _ctx.UserId,
                Endpoint = endpoint,
                EndpointHash = endpointHash,
                P256Dh = p256Dh,
                Auth = auth,
                NotificationsEnabled = true,
                ListsEnabled = request.ListsEnabled,
                BudgetEnabled = request.BudgetEnabled,
                CalendarEnabled = request.CalendarEnabled,
                UserAgent = NormalizeUserAgent(request.UserAgent),
                CreatedAtUtc = now
            });
        }
        else
        {
            existing.UserId = _ctx.UserId;
            existing.Endpoint = endpoint;
            existing.P256Dh = p256Dh;
            existing.Auth = auth;
            existing.NotificationsEnabled = true;
            existing.ListsEnabled = request.ListsEnabled;
            existing.BudgetEnabled = request.BudgetEnabled;
            existing.CalendarEnabled = request.CalendarEnabled;
            existing.UserAgent = NormalizeUserAgent(request.UserAgent);
            existing.UpdatedAtUtc = now;
        }

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    /// <summary>
    /// Remove uma subscrição Web Push pelo endpoint.
    /// </summary>
    [HttpDelete("subscriptions")]
    public async Task<IActionResult> DeleteSubscription([FromQuery] string endpoint, CancellationToken ct)
    {
        var normalizedEndpoint = (endpoint ?? "").Trim();
        if (string.IsNullOrWhiteSpace(normalizedEndpoint))
            return BadRequest("Endpoint é obrigatório.");

        var endpointHash = ComputeEndpointHash(normalizedEndpoint);
        var subscription = await _db.WebPushSubscriptions
            .FirstOrDefaultAsync(s => s.EndpointHash == endpointHash && s.UserId == _ctx.UserId, ct);

        if (subscription is null)
            return NoContent();

        _db.WebPushSubscriptions.Remove(subscription);
        await _db.SaveChangesAsync(ct);

        return NoContent();
    }

    private static string ComputeEndpointHash(string endpoint)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(endpoint));
        return Convert.ToHexString(bytes);
    }

    private static string? NormalizeUserAgent(string? value)
    {
        var trimmed = (value ?? "").Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }
}
