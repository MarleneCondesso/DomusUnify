using DomusUnify.Api.DTOs.Budgets;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Budgets;
using DomusUnify.Application.Budgets.Models;
using DomusUnify.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints para gestão de orçamentos (recorrentes e únicos) na família atual.
/// </summary>
/// <remarks>
/// Um orçamento pertence a uma família e pode ter visibilidade:
/// <list type="bullet">
/// <item><description><c>Private</c> — apenas o dono.</description></item>
/// <item><description><c>AllMembers</c> — todos os membros da família.</description></item>
/// <item><description><c>SpecificMembers</c> — apenas membros selecionados.</description></item>
/// </list>
/// </remarks>
[ApiController]
[Route("api/v1/budgets")]
[Authorize]
public sealed class BudgetsController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IBudgetService _svc;

    public BudgetsController(ICurrentUserContext ctx, IBudgetService svc)
    {
        _ctx = ctx;
        _svc = svc;
    }

    /// <summary>
    /// Obtém a lista de orçamentos a que o utilizador tem acesso na família atual.
    /// </summary>
    /// <remarks>
    /// Apenas devolve orçamentos visíveis para o utilizador autenticado, de acordo com a configuração de visibilidade.
    /// </remarks>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de orçamentos.</returns>
    [HttpGet]
    public async Task<ActionResult<List<BudgetSummaryResponse>>> Get(CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        var rows = await _svc.GetAsync(_ctx.UserId, familyId, ct);

        return Ok(rows.Select(b => new BudgetSummaryResponse
        {
            Id = b.Id,
            Name = b.Name,
            IconKey = b.IconKey,
            Type = b.Type,
            CurrencyCode = b.CurrencyCode,
            VisibilityMode = b.VisibilityMode
        }).ToList());
    }

    /// <summary>
    /// Obtém os detalhes de um orçamento pelo seu identificador.
    /// </summary>
    /// <remarks>
    /// Devolve <c>404 Not Found</c> se o orçamento não existir na família atual, e <c>403 Forbidden</c> se o utilizador
    /// não tiver permissões para aceder a este orçamento.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Os detalhes do orçamento.</returns>
    [HttpGet("{budgetId:guid}")]
    public async Task<ActionResult<BudgetDetailResponse>> GetById(Guid budgetId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var b = await _svc.GetByIdAsync(_ctx.UserId, familyId, budgetId, ct);

            return Ok(ToDetailResponse(b));
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Cria um novo orçamento na família atual.
    /// </summary>
    /// <remarks>
    /// Para orçamentos <c>Recurring</c> é obrigatório indicar o período e a data de início.
    /// Pode ainda definir limites por categoria (despesas) e um limite global de gastos.
    /// </remarks>
    /// <param name="request">Dados do orçamento a criar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Os detalhes do orçamento criado.</returns>
    [HttpPost]
    public async Task<ActionResult<BudgetDetailResponse>> Create(CreateBudgetRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

            var mainIndicator = ParseOptionalEnum<BudgetMainIndicator>(request.MainIndicator, "MainIndicator inválido.");
            var order = ParseOptionalEnum<BudgetTransactionOrder>(request.TransactionOrder, "TransactionOrder inválido.");
            var upcoming = ParseOptionalEnum<BudgetUpcomingDisplayMode>(request.UpcomingDisplayMode, "UpcomingDisplayMode inválido.");

            var input = new BudgetCreateInput(
                request.Name,
                request.IconKey,
                request.Type,
                request.PeriodType,
                request.StartDate,
                request.EndDate,
                request.SemiMonthlyPattern,
                request.SpendingLimit,
                request.CurrencyCode,
                request.VisibilityMode,
                request.AllowedUserIds,
                mainIndicator,
                request.OnlyPaidInTotals,
                order,
                upcoming,
                request.CategoryLimits?.Select(l => new BudgetCategoryLimitInput(l.CategoryId, l.Amount)).ToList()
            );

            var created = await _svc.CreateAsync(_ctx.UserId, familyId, input, ct);
            return Ok(ToDetailResponse(created));
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Atualiza as configurações de um orçamento existente.
    /// </summary>
    /// <remarks>
    /// Permite alterar nome/ícone, período (se recorrente), moeda, visibilidade e opções de exibição.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="request">Dados a atualizar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Os detalhes do orçamento após atualização.</returns>
    [HttpPatch("{budgetId:guid}")]
    public async Task<ActionResult<BudgetDetailResponse>> Update(Guid budgetId, UpdateBudgetRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

            var mainIndicator = ParseOptionalEnum<BudgetMainIndicator>(request.MainIndicator, "MainIndicator inválido.");
            var order = ParseOptionalEnum<BudgetTransactionOrder>(request.TransactionOrder, "TransactionOrder inválido.");
            var upcoming = ParseOptionalEnum<BudgetUpcomingDisplayMode>(request.UpcomingDisplayMode, "UpcomingDisplayMode inválido.");

            var input = new BudgetUpdateInput(
                request.Name,
                request.IconKey,
                request.PeriodType,
                request.StartDate,
                request.EndDate,
                request.SemiMonthlyPattern,
                request.SpendingLimit,
                request.SpendingLimitChangeRequested,
                request.CurrencyCode,
                request.VisibilityMode,
                request.AllowedUserIds,
                mainIndicator,
                request.OnlyPaidInTotals,
                order,
                upcoming
            );

            var updated = await _svc.UpdateAsync(_ctx.UserId, familyId, budgetId, input, ct);
            return Ok(ToDetailResponse(updated));
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Elimina um orçamento da família atual.
    /// </summary>
    /// <remarks>
    /// Ao eliminar um orçamento são eliminadas também as suas transações e limites associados.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpDelete("{budgetId:guid}")]
    public async Task<IActionResult> Delete(Guid budgetId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            await _svc.DeleteAsync(_ctx.UserId, familyId, budgetId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Obtém a lista de membros associados ao orçamento.
    /// </summary>
    /// <remarks>
    /// Para orçamentos com visibilidade <c>AllMembers</c>, devolve todos os membros da família.
    /// Para <c>Private</c> ou <c>SpecificMembers</c>, devolve apenas os membros com acesso.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de membros do orçamento.</returns>
    [HttpGet("{budgetId:guid}/members")]
    public async Task<ActionResult<List<BudgetMemberResponse>>> GetMembers(Guid budgetId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var rows = await _svc.GetMembersAsync(_ctx.UserId, familyId, budgetId, ct);

            return Ok(rows.Select(m => new BudgetMemberResponse
            {
                UserId = m.UserId,
                Name = m.Name,
                Role = m.Role
            }).ToList());
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Obtém os limites por categoria (despesas) definidos para um orçamento.
    /// </summary>
    /// <remarks>
    /// Esta lista é usada para configurar quanto se pretende gastar por categoria dentro do orçamento.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de limites por categoria.</returns>
    [HttpGet("{budgetId:guid}/category-limits")]
    public async Task<ActionResult<List<BudgetCategoryLimitResponse>>> GetCategoryLimits(Guid budgetId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var rows = await _svc.GetCategoryLimitsAsync(_ctx.UserId, familyId, budgetId, ct);

            return Ok(rows.Select(l => new BudgetCategoryLimitResponse
            {
                Id = l.Id,
                CategoryId = l.CategoryId,
                CategoryName = l.CategoryName,
                CategoryIconKey = l.CategoryIconKey,
                CategorySortOrder = l.CategorySortOrder,
                Amount = l.Amount
            }).ToList());
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Atualiza os limites por categoria (despesas) de um orçamento.
    /// </summary>
    /// <remarks>
    /// Envia a lista de categorias e respetivos limites. Os valores devem ser maiores ou iguais a zero.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="request">Pedido com a lista de limites a atualizar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpPut("{budgetId:guid}/category-limits")]
    public async Task<IActionResult> UpdateCategoryLimits(Guid budgetId, UpdateBudgetCategoryLimitsRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var limits = request.Limits.Select(l => new BudgetCategoryLimitInput(l.CategoryId, l.Amount)).ToList();
            await _svc.UpdateCategoryLimitsAsync(_ctx.UserId, familyId, budgetId, limits, ct);
            return NoContent();
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    private static BudgetDetailResponse ToDetailResponse(BudgetDetailModel b) => new()
    {
        Id = b.Id,
        FamilyId = b.FamilyId,
        OwnerUserId = b.OwnerUserId,
        Name = b.Name,
        IconKey = b.IconKey,
        Type = b.Type,
        PeriodType = b.PeriodType,
        StartDate = b.StartDate,
        EndDate = b.EndDate,
        SemiMonthlyPattern = b.SemiMonthlyPattern,
        SpendingLimit = b.SpendingLimit,
        CurrencyCode = b.CurrencyCode,
        VisibilityMode = b.VisibilityMode,
        AllowedUserIds = b.AllowedUserIds.ToList(),
        MainIndicator = b.MainIndicator.ToString(),
        OnlyPaidInTotals = b.OnlyPaidInTotals,
        TransactionOrder = b.TransactionOrder.ToString(),
        UpcomingDisplayMode = b.UpcomingDisplayMode.ToString()
    };

    private static TEnum? ParseOptionalEnum<TEnum>(string? value, string message) where TEnum : struct
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (!Enum.TryParse<TEnum>(value, true, out var parsed))
            throw new ArgumentException(message);
        return parsed;
    }
}
