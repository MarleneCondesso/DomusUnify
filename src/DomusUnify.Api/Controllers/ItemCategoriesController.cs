using DomusUnify.Api.DTOs.Categories;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Categories;
using DomusUnify.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints para gestão de categorias de itens (listas) na família atual.
/// </summary>
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

    /// <summary>
    /// Obtém todas as categorias de itens para a família atual.
    /// </summary>
    /// <remarks>
    /// Lista todas as categorias visíveis para o utilizador na família atual.
    /// </remarks>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de respostas de categorias.</returns>
    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> Get(CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        var rows = await _svc.GetItemCategoriesAsync(_ctx.UserId, familyId, ct);

        return Ok(rows.Select(x => new CategoryResponse
        {
            Id = x.Id,
            Name = x.Name,
            Type = x.Type.ToString(),
            IconKey = x.IconKey,
            SortOrder = x.SortOrder
        }).ToList());
    }

    /// <summary>
    /// Cria uma nova categoria de itens para a família atual.
    /// </summary>
    /// <remarks>
    /// Permite definir nome, ícone e ordem de classificação. O utilizador deve ter permissões na família.
    /// </remarks>
    /// <param name="request">O pedido contendo detalhes da categoria a criar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A resposta da categoria criada.</returns>
    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(CreateCategoryRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

            if (!Enum.TryParse<ListType>(request.Type, true, out var type))
                return BadRequest("Tipo invÃ¡lido. Use Shopping, Tasks ou Custom.");

            var created = await _svc.CreateItemCategoryAsync(
                _ctx.UserId, familyId,
                request.Name, type, request.IconKey, request.SortOrder, ct);

            return Ok(new CategoryResponse
            {
                Id = created.Id,
                Name = created.Name,
                Type = created.Type.ToString(),
                IconKey = created.IconKey,
                SortOrder = created.SortOrder
            });
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Atualiza uma categoria de itens existente.
    /// </summary>
    /// <remarks>
    /// Permite alterar nome/ícone e reordenar a categoria via <c>SortOrder</c>.
    /// </remarks>
    /// <param name="categoryId">O ID da categoria a atualizar.</param>
    /// <param name="request">O pedido contendo detalhes atualizados da categoria.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A resposta da categoria atualizada.</returns>
    [HttpPatch("{categoryId:guid}")]
    public async Task<ActionResult<CategoryResponse>> Update(Guid categoryId, UpdateCategoryRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

            ListType? type = null;
            if (request.Type is not null)
            {
                if (!Enum.TryParse<ListType>(request.Type, true, out var parsed))
                    return BadRequest("Tipo invÃ¡lido. Use Shopping, Tasks ou Custom.");
                type = parsed;
            }

            var updated = await _svc.UpdateItemCategoryAsync(
                _ctx.UserId, familyId,
                categoryId, request.Name, type, request.IconKey, request.SortOrder, ct);

            return Ok(new CategoryResponse
            {
                Id = updated.Id,
                Name = updated.Name,
                Type = updated.Type.ToString(),
                IconKey = updated.IconKey,
                SortOrder = updated.SortOrder
            });
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Elimina uma categoria de itens.
    /// </summary>
    /// <remarks>
    /// Remove a categoria se não estiver em uso. O utilizador deve ter permissões na família.
    /// </remarks>
    /// <param name="categoryId">O ID da categoria a eliminar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
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
