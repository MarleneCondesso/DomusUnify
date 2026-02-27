using DomusUnify.Api.DTOs.Lists;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Lists;
using DomusUnify.Application.Lists.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints de gestão de listas (ex.: compras/tarefas) e respetivos itens na família atual.
/// </summary>
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
    /// Obtém todas as listas visíveis para o utilizador na família atual.
    /// </summary>
    /// <remarks>
    /// Lista todas as listas visíveis para o utilizador, incluindo contagem de itens, concluídos e informação de partilha.
    /// </remarks>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de respostas de listas.</returns>
    // GET api/v1/lists
    [HttpGet]
    public async Task<ActionResult<List<ListResponse>>> GetLists(CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var data = await _listService.GetListsAsync(_ctx.UserId, familyId, ct);

        return Ok(data.Select(ToResponse).ToList());
    }

    /// <summary>
    /// Cria uma nova lista para a família atual.
    /// </summary>
    /// <remarks>
    /// Permite definir nome, cor, tipo e visibilidade da lista.
    /// </remarks>
    /// <param name="request">O pedido contendo detalhes da lista a criar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A resposta da lista criada.</returns>
    // POST api/v1/lists
    [HttpPost]
    public async Task<ActionResult<ListResponse>> CreateList(CreateListRequest request, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        var created = await _listService.CreateListAsync(
            _ctx.UserId,
            familyId,
            new ListCreateInput(
                request.Name,
                request.ColorHex,
                request.Type,
                request.VisibilityMode,
                request.AllowedUserIds),
            ct);

        return Ok(ToResponse(created));
    }

    /// <summary>
    /// Regenera as capas (imagens) das listas visíveis para o utilizador.
    /// </summary>
    /// <remarks>
    /// Útil quando a API de stock images foi configurada depois de já existirem listas (capas antigas em SVG).
    /// </remarks>
    [HttpPost("regenerate-covers")]
    public async Task<ActionResult<object>> RegenerateCovers(CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        var updatedCount = await _listService.RegenerateListCoversAsync(_ctx.UserId, familyId, ct);
        return Ok(new { updatedCount });
    }

    /// <summary>
    /// Atualiza uma lista existente.
    /// </summary>
    /// <remarks>
    /// Permite alterar nome, cor e tipo da lista. A visibilidade/partilha pode ser alterada (opcional).
    /// </remarks>
    /// <param name="listId">O ID da lista a atualizar.</param>
    /// <param name="request">O pedido contendo detalhes atualizados da lista.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpPatch("{listId:guid}")]
    public async Task<IActionResult> UpdateList(Guid listId, UpdateListRequest request, CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

        await _listService.UpdateListAsync(
            _ctx.UserId,
            familyId,
            listId,
            new ListUpdateInput(
                request.Name,
                request.ColorHex,
                request.Type,
                request.VisibilityMode,
                request.AllowedUserIds),
            ct);

        return NoContent();
    }

    /// <summary>
    /// Elimina uma lista existente.
    /// </summary>
    /// <remarks>
    /// Ao eliminar uma lista, são eliminados também os respetivos itens.
    /// </remarks>
    /// <param name="listId">O ID da lista a eliminar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
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
            AssigneeUserId = i.AssigneeUserId,
            Note = i.Note,
            PhotoUrl = i.PhotoUrl,
            CompletedAtUtc = i.CompletedAtUtc,
            CompletedByUserId = i.CompletedByUserId
        }).ToList());
    }

    /// <summary>
    /// Adiciona um novo item a uma lista.
    /// </summary>
    /// <remarks>
    /// Permite definir nome e categoria opcional do item.
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

        var item = await _listService.AddItemAsync(
            _ctx.UserId,
            familyId,
            listId,
            request.Name,
            request.CategoryId,
            request.AssigneeUserId,
            request.Note,
            request.PhotoUrl,
            ct);

        return Ok(new ListItemResponse
        {
            Id = item.Id,
            ListId = item.ListId,
            Name = item.Name,
            CategoryId = item.CategoryId,
            AssigneeUserId = item.AssigneeUserId,
            Note = item.Note,
            PhotoUrl = item.PhotoUrl,
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

        bool assigneeChangeRequested = false;
        Guid? assigneeUserId = null;

        bool noteChangeRequested = false;
        string? note = null;

        bool photoChangeRequested = false;
        string? photoUrl = null;

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

        if (request.AssigneeUserId.HasValue)
        {
            assigneeChangeRequested = true;

            if (request.AssigneeUserId.Value.ValueKind == System.Text.Json.JsonValueKind.Null)
            {
                assigneeUserId = null; // remover
            }
            else if (request.AssigneeUserId.Value.ValueKind == System.Text.Json.JsonValueKind.String
                     && Guid.TryParse(request.AssigneeUserId.Value.GetString(), out var parsedAssignee))
            {
                assigneeUserId = parsedAssignee; // definir
            }
            else
            {
                return BadRequest("AssigneeUserId invÃ¡lido. Envia GUID string ou null.");
            }
        }

        if (request.Note.HasValue)
        {
            noteChangeRequested = true;

            if (request.Note.Value.ValueKind == System.Text.Json.JsonValueKind.Null)
            {
                note = null; // remover
            }
            else if (request.Note.Value.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                note = request.Note.Value.GetString(); // definir
            }
            else
            {
                return BadRequest("Note invÃ¡lida. Envia string ou null.");
            }
        }

        if (request.PhotoUrl.HasValue)
        {
            photoChangeRequested = true;

            if (request.PhotoUrl.Value.ValueKind == System.Text.Json.JsonValueKind.Null)
            {
                photoUrl = null; // remover
            }
            else if (request.PhotoUrl.Value.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                photoUrl = request.PhotoUrl.Value.GetString(); // definir
            }
            else
            {
                return BadRequest("PhotoUrl invÃ¡lida. Envia string ou null.");
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
            assigneeChangeRequested,
            assigneeUserId,
            noteChangeRequested,
            note,
            photoChangeRequested,
            photoUrl,
            ct);

        return NoContent();
    }

    /// <summary>
    /// Elimina um item de lista existente.
    /// </summary>
    /// <remarks>
    /// Remove o item da lista.
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

    private static ListResponse ToResponse(ListSummary x) => new()
    {
        Id = x.Id,
        Name = x.Name,
        Type = x.Type,
        ColorHex = x.ColorHex,
        CoverImageUrl = x.CoverImageUrl,
        OwnerUserId = x.OwnerUserId,
        VisibilityMode = x.VisibilityMode,
        AllowedUserIds = x.AllowedUserIds.Distinct().ToList(),
        SharedWithMembers = x.SharedWithMembers
            .Select(m => new SharedListMemberPreviewResponse { UserId = m.UserId, Name = m.Name })
            .ToList(),
        ItemsCount = x.ItemsCount,
        CompletedCount = x.CompletedCount
    };
}
