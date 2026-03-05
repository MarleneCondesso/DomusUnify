using DomusUnify.Api.DTOs.Finance;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Budgets;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints para gerir contas financeiras visíveis/ocultas dentro de um orçamento.
/// </summary>
[ApiController]
[Route("api/v1/budgets/{budgetId:guid}/accounts")]
[Authorize]
public sealed class BudgetAccountsController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IBudgetAccountsService _svc;

    public BudgetAccountsController(ICurrentUserContext ctx, IBudgetAccountsService svc)
    {
        _ctx = ctx;
        _svc = svc;
    }

    /// <summary>
    /// Obtém as contas visíveis neste orçamento.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<FinanceAccountResponse>>> GetVisible(Guid budgetId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var rows = await _svc.GetVisibleAsync(_ctx.UserId, familyId, budgetId, ct);

            return Ok(rows.Select(a => new FinanceAccountResponse
            {
                Id = a.Id,
                Type = a.Type,
                Name = a.Name,
                IconKey = a.IconKey,
                SortOrder = a.SortOrder
            }).ToList());
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Obtém as contas ocultadas neste orçamento.
    /// </summary>
    [HttpGet("hidden")]
    public async Task<ActionResult<List<FinanceAccountResponse>>> GetHidden(Guid budgetId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var rows = await _svc.GetHiddenAsync(_ctx.UserId, familyId, budgetId, ct);

            return Ok(rows.Select(a => new FinanceAccountResponse
            {
                Id = a.Id,
                Type = a.Type,
                Name = a.Name,
                IconKey = a.IconKey,
                SortOrder = a.SortOrder
            }).ToList());
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Oculta uma conta neste orçamento.
    /// </summary>
    [HttpPut("hidden/{accountId:guid}")]
    public async Task<IActionResult> Hide(Guid budgetId, Guid accountId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            await _svc.HideAsync(_ctx.UserId, familyId, budgetId, accountId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Remove uma conta da lista de ocultas (volta a ficar visível) neste orçamento.
    /// </summary>
    [HttpDelete("hidden/{accountId:guid}")]
    public async Task<IActionResult> Unhide(Guid budgetId, Guid accountId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            await _svc.UnhideAsync(_ctx.UserId, familyId, budgetId, accountId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}

