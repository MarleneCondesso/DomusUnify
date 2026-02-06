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

    /// <summary>
    /// Obtém todas as listas para a família atual.
    /// </summary>
    /// <remarks>
    /// Lista todas as listas visíveis para o utilizador, incluindo contagem de itens e completados.
    /// </remarks>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de respostas de listas.</returns>
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

    /// <summary>
    /// Cria uma nova lista para a família atual.
    /// </summary>
    /// <remarks>
    /// Permite definir nome, cor e tipo da lista. O utilizador deve ter permissões na família.
    /// </remarks>
    /// <param name="request">O pedido contendo detalhes da lista a criar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A resposta da lista criada.</returns>
    // POST api/v1/lists
    [HttpPost]
    public async Task<ActionResult<ListResponse>> CreateList(CreateListRequest request, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var created = await _listService.CreateListAsync(_ctx.UserId, familyId, request.Name, request.ColorHex, request.Type, ct);

        return Ok(new ListResponse
        {
            Id = created.Id,
            Name = created.Name,
            Type = created.Type,
            ColorHex = created.ColorHex,
            ItemsCount = created.ItemsCount,
            CompletedCount = created.CompletedCount
        });
    }

    /// <summary>
    /// Atualiza uma lista existente.
    /// </summary>
    /// <remarks>
    /// Permite alterar nome, cor e tipo da lista. O utilizador deve ter permissões na família.
    /// </remarks>
    /// <param name="listId">O ID da lista a atualizar.</param>
    /// <param name="request">O pedido contendo detalhes atualizados da lista.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpPatch("{listId:guid}")]
    public async Task<IActionResult> UpdateList(Guid listId, UpdateListRequest request, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        await _listService.UpdateListAsync(_ctx.UserId, familyId, listId, request.Name, request.ColorHex, request.Type, ct);
        return NoContent();
    }

    [HttpDelete("{listId:guid}")]
    public async Task<IActionResult> DeleteList(Guid listId, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        await _listService.DeleteListAsync(_ctx.UserId, familyId, listId, ct);
        return NoContent();
    }

    /// <summary>
    /// Obtém todos os itens de uma lista.
    /// </summary>
    /// <remarks>
    /// Lista todos os itens da lista especificada, incluindo estado de conclusão e categoria.
    /// </remarks>
    /// <param name="listId">O ID da lista.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de respostas de itens da lista.</returns>
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

    /// <summary>
    /// Adiciona um novo item a uma lista.
    /// </summary>
    /// <remarks>
    /// Permite definir nome e categoria opcional do item. O utilizador deve ter permissões na família.
    /// </remarks>
    /// <param name="listId">O ID da lista.</param>
    /// <param name="request">O pedido contendo detalhes do item a adicionar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A resposta do item da lista adicionado.</returns>
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

    /// <summary>
    /// Atualiza um item de lista existente.
    /// </summary>
    /// <remarks>
    /// Permite alterar nome, estado de conclusão e categoria. CategoryId pode ser null para remover categoria.
    /// </remarks>
    /// <param name="itemId">O ID do item a atualizar.</param>
    /// <param name="request">O pedido contendo detalhes atualizados do item.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
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


    /// <summary>
    /// Elimina um item de lista existente.
    /// </summary>
    /// <remarks>
    /// Remove o item da lista. O utilizador deve ter permissões na família.
    /// </remarks>
    /// <param name="itemId">O ID do item a eliminar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    // DELETE api/v1/lists/items/{itemId}
    [HttpDelete("items/{itemId:guid}")]
    public async Task<IActionResult> DeleteItem(Guid itemId, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        await _listService.DeleteItemAsync(_ctx.UserId, familyId, itemId, ct);

        return NoContent();
    }
}
