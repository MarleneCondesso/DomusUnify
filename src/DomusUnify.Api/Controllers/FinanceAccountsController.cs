using DomusUnify.Api.DTOs.Finance;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.FinanceAccounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

[ApiController]
[Route("api/v1/finance-accounts")]
[Authorize]
public sealed class FinanceAccountsController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IFinanceAccountService _svc;

    public FinanceAccountsController(ICurrentUserContext ctx, IFinanceAccountService svc)
    {
        _ctx = ctx;
        _svc = svc;
    }

    [HttpGet]
    public async Task<ActionResult<List<FinanceAccountResponse>>> Get(CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        var rows = await _svc.GetAsync(_ctx.UserId, familyId, ct);

        return Ok(rows.Select(a => new FinanceAccountResponse
        {
            Id = a.Id,
            Type = a.Type,
            Name = a.Name,
            IconKey = a.IconKey,
            SortOrder = a.SortOrder
        }).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<FinanceAccountResponse>> Create(CreateFinanceAccountRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var created = await _svc.CreateAsync(_ctx.UserId, familyId, request.Type, request.Name, request.IconKey, request.SortOrder, ct);

            return Ok(new FinanceAccountResponse
            {
                Id = created.Id,
                Type = created.Type,
                Name = created.Name,
                IconKey = created.IconKey,
                SortOrder = created.SortOrder
            });
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpPatch("{accountId:guid}")]
    public async Task<ActionResult<FinanceAccountResponse>> Update(Guid accountId, UpdateFinanceAccountRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var updated = await _svc.UpdateAsync(_ctx.UserId, familyId, accountId, request.Name, request.IconKey, request.SortOrder, ct);

            return Ok(new FinanceAccountResponse
            {
                Id = updated.Id,
                Type = updated.Type,
                Name = updated.Name,
                IconKey = updated.IconKey,
                SortOrder = updated.SortOrder
            });
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpDelete("{accountId:guid}")]
    public async Task<IActionResult> Delete(Guid accountId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            await _svc.DeleteAsync(_ctx.UserId, familyId, accountId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}

