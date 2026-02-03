using DomusUnify.Api.DTOs.Lists;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Lists;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
namespace DomusUnify.Api.Controllers;

[ApiController]
[Route("api/v1/lists")]
[Authorize]
public class ListsController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IListService _listService;

    public ListsController(ICurrentUserContext ctx, IListService listService)
    {
        _ctx = ctx;
        _listService = listService;
    }

    // GET api/v1/lists
    [HttpGet]
    public async Task<ActionResult<List<ListResponse>>> GetLists(CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var data = await _listService.GetListsAsync(_ctx.UserId, familyId, ct);

        return Ok(data.Select(x => new ListResponse
        {
            Id = x.Id,
            Name = x.Name,
            Type = x.Type,
            ItemsCount = x.ItemsCount,
            CompletedCount = x.CompletedCount
        }).ToList());
    }

    // POST api/v1/lists
    [HttpPost]
    public async Task<ActionResult<ListResponse>> CreateList(CreateListRequest request, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var created = await _listService.CreateListAsync(_ctx.UserId, familyId, request.Name, request.Type, ct);

        return Ok(new ListResponse
        {
            Id = created.Id,
            Name = created.Name,
            Type = created.Type,
            ItemsCount = created.ItemsCount,
            CompletedCount = created.CompletedCount
        });
    }

    [HttpPatch("{listId:guid}")]
    public async Task<IActionResult> RenameList(Guid listId, RenameListRequest request, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        await _listService.RenameListAsync(_ctx.UserId, familyId, listId, request.Name, ct);
        return NoContent();
    }

    [HttpDelete("{listId:guid}")]
    public async Task<IActionResult> DeleteList(Guid listId, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        await _listService.DeleteListAsync(_ctx.UserId, familyId, listId, ct);
        return NoContent();
    }

    // GET api/v1/lists/{listId}/items
    [HttpGet("{listId:guid}/items")]
    public async Task<ActionResult<List<ListItemResponse>>> GetItems(Guid listId, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var items = await _listService.GetItemsAsync(_ctx.UserId, familyId, listId, ct);

        return Ok(items.Select(i => new ListItemResponse
        {
            Id = i.Id,
            ListId = i.ListId,
            Name = i.Name,
            IsCompleted = i.IsCompleted,
            CategoryId = i.CategoryId,
            CompletedAtUtc = i.CompletedAtUtc,
            CompletedByUserId = i.CompletedByUserId
        }).ToList());

    }

    // POST api/v1/lists/{listId}/items
    [HttpPost("{listId:guid}/items")]
    public async Task<ActionResult<ListItemResponse>> AddItem(Guid listId, CreateListItemRequest request, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var item = await _listService.AddItemAsync(_ctx.UserId, familyId, listId, request.Name, request.CategoryId, ct);

        return Ok(new ListItemResponse
        {
            Id = item.Id,
            ListId = item.ListId,
            Name = item.Name,
            CategoryId = item.CategoryId,
            IsCompleted = item.IsCompleted,
            CompletedAtUtc = item.CompletedAtUtc,
            CompletedByUserId = item.CompletedByUserId
        });
    }

    // PATCH api/v1/lists/items/{itemId}
    [HttpPatch("items/{itemId:guid}")]
    public async Task<IActionResult> UpdateItem(Guid itemId, UpdateListItemRequest request, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        bool categoryChangeRequested = false;
        Guid? categoryId = null;

        if (request.CategoryId.HasValue)
        {
            categoryChangeRequested = true;

            if (request.CategoryId.Value.ValueKind == System.Text.Json.JsonValueKind.Null)
            {
                categoryId = null; // remover
            }
            else if (request.CategoryId.Value.ValueKind == System.Text.Json.JsonValueKind.String
                     && Guid.TryParse(request.CategoryId.Value.GetString(), out var parsed))
            {
                categoryId = parsed; // definir
            }
            else
            {
                return BadRequest("CategoryId inválido. Envia GUID string ou null.");
            }
        }

        await _listService.UpdateItemAsync(
            _ctx.UserId,
            familyId,
            itemId,
            request.Name,
            request.IsCompleted,
            categoryChangeRequested,
            categoryId,
            ct);

        return NoContent();
    }


    // DELETE api/v1/lists/items/{itemId}
    [HttpDelete("items/{itemId:guid}")]
    public async Task<IActionResult> DeleteItem(Guid itemId, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        await _listService.DeleteItemAsync(_ctx.UserId, familyId, itemId, ct);

        return NoContent();
    }
}
