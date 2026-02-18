using DomusUnify.Api.DTOs.Finance;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.FinanceCategories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

[ApiController]
[Route("api/v1/finance-categories")]
[Authorize]
public sealed class FinanceCategoriesController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IFinanceCategoryService _svc;

    public FinanceCategoriesController(ICurrentUserContext ctx, IFinanceCategoryService svc)
    {
        _ctx = ctx;
        _svc = svc;
    }

    [HttpGet]
    public async Task<ActionResult<List<FinanceCategoryResponse>>> Get([FromQuery] string? type, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        var rows = await _svc.GetAsync(_ctx.UserId, familyId, type, ct);

        return Ok(rows.Select(c => new FinanceCategoryResponse
        {
            Id = c.Id,
            Type = c.Type,
            Name = c.Name,
            IconKey = c.IconKey,
            SortOrder = c.SortOrder
        }).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<FinanceCategoryResponse>> Create(CreateFinanceCategoryRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var created = await _svc.CreateAsync(_ctx.UserId, familyId, request.Type, request.Name, request.IconKey, request.SortOrder, ct);

            return Ok(new FinanceCategoryResponse
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

    [HttpPatch("{categoryId:guid}")]
    public async Task<ActionResult<FinanceCategoryResponse>> Update(Guid categoryId, UpdateFinanceCategoryRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var updated = await _svc.UpdateAsync(_ctx.UserId, familyId, categoryId, request.Name, request.IconKey, request.SortOrder, ct);

            return Ok(new FinanceCategoryResponse
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

    [HttpDelete("{categoryId:guid}")]
    public async Task<IActionResult> Delete(Guid categoryId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            await _svc.DeleteAsync(_ctx.UserId, familyId, categoryId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}

