using DomusUnify.Api.DTOs.Finance;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.FinanceCategories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints para gestão de categorias financeiras (despesas e rendimentos) na família atual.
/// </summary>
/// <remarks>
/// As categorias financeiras são usadas nas transações do orçamento e podem ser do tipo:
/// <list type="bullet">
/// <item><description><c>Expense</c> — categoria de despesa.</description></item>
/// <item><description><c>Income</c> — categoria de rendimento.</description></item>
/// </list>
/// </remarks>
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

    /// <summary>
    /// Obtém as categorias financeiras da família atual.
    /// </summary>
    /// <remarks>
    /// Por omissão, devolve todas as categorias (despesas e rendimentos). Pode filtrar por <paramref name="type"/>.
    /// </remarks>
    /// <param name="type">Filtro opcional por tipo: <c>Expense</c> ou <c>Income</c>.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de categorias financeiras.</returns>
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

    /// <summary>
    /// Cria uma nova categoria financeira na família atual.
    /// </summary>
    /// <remarks>
    /// O utilizador deve ter permissões de edição na família (por exemplo, não pode ser <c>Viewer</c>).
    /// </remarks>
    /// <param name="request">Dados da categoria a criar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A categoria criada.</returns>
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

    /// <summary>
    /// Atualiza uma categoria financeira existente.
    /// </summary>
    /// <remarks>
    /// Permite alterar nome/ícone e reordenar a categoria via <c>SortOrder</c>.
    /// </remarks>
    /// <param name="categoryId">Identificador da categoria.</param>
    /// <param name="request">Dados a atualizar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A categoria atualizada.</returns>
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

    /// <summary>
    /// Elimina uma categoria financeira.
    /// </summary>
    /// <remarks>
    /// A operação falha com conflito se a categoria estiver a ser usada por transações ou limites de orçamento.
    /// </remarks>
    /// <param name="categoryId">Identificador da categoria.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
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
