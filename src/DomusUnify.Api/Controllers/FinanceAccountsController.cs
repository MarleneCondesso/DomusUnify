using DomusUnify.Api.DTOs.Finance;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.FinanceAccounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints para gestão de contas financeiras (ex.: conta corrente, dinheiro, cartão de crédito) na família atual.
/// </summary>
/// <remarks>
/// As contas financeiras são usadas para classificar transações por origem/destino do dinheiro.
/// </remarks>
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

    /// <summary>
    /// Obtém as contas financeiras da família atual.
    /// </summary>
    /// <remarks>
    /// Se não existirem contas ainda, o serviço cria automaticamente um conjunto de contas por defeito.
    /// </remarks>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de contas financeiras.</returns>
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

    /// <summary>
    /// Cria uma nova conta financeira na família atual.
    /// </summary>
    /// <remarks>
    /// O utilizador deve ter permissões de edição na família (por exemplo, não pode ser <c>Viewer</c>).
    /// </remarks>
    /// <param name="request">Dados da conta a criar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A conta criada.</returns>
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

    /// <summary>
    /// Atualiza uma conta financeira existente.
    /// </summary>
    /// <remarks>
    /// Permite alterar nome/ícone e reordenar a conta via <c>SortOrder</c>.
    /// </remarks>
    /// <param name="accountId">Identificador da conta.</param>
    /// <param name="request">Dados a atualizar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A conta atualizada.</returns>
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

    /// <summary>
    /// Elimina uma conta financeira.
    /// </summary>
    /// <remarks>
    /// A operação falha com conflito se a conta estiver a ser usada por transações.
    /// </remarks>
    /// <param name="accountId">Identificador da conta.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
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
