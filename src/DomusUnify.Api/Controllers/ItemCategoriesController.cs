using DomusUnify.Api.DTOs.Categories;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Categories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

[ApiController]
[Route("api/v1/item-categories")]
[Authorize]
public class ItemCategoriesController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly ICategoryService _svc;

    public ItemCategoriesController(ICurrentUserContext ctx, ICategoryService svc)
    {
        _ctx = ctx;
        _svc = svc;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> Get(CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        var rows = await _svc.GetItemCategoriesAsync(_ctx.UserId, familyId, ct);

        return Ok(rows.Select(x => new CategoryResponse
        {
            Id = x.Id,
            Name = x.Name,
            IconKey = x.IconKey,
            SortOrder = x.SortOrder
        }).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(CreateCategoryRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

            var created = await _svc.CreateItemCategoryAsync(
                _ctx.UserId, familyId,
                request.Name, request.IconKey, request.SortOrder, ct);

            return Ok(new CategoryResponse
            {
                Id = created.Id,
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
    public async Task<ActionResult<CategoryResponse>> Update(Guid categoryId, UpdateCategoryRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

            var updated = await _svc.UpdateItemCategoryAsync(
                _ctx.UserId, familyId,
                categoryId, request.Name, request.IconKey, request.SortOrder, ct);

            return Ok(new CategoryResponse
            {
                Id = updated.Id,
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
            await _svc.DeleteItemCategoryAsync(_ctx.UserId, familyId, categoryId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}
