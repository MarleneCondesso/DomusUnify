using DomusUnify.Api.DTOs.Finance;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.FinanceTransactions;
using DomusUnify.Application.FinanceTransactions.Models;
using DomusUnify.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints para gestão de transações financeiras dentro de um orçamento.
/// </summary>
/// <remarks>
/// Estes endpoints operam sempre no contexto de uma família (família atual do utilizador) e de um orçamento
/// identificado por <c>{budgetId}</c>.
/// </remarks>
[ApiController]
[Route("api/v1/budgets/{budgetId:guid}/transactions")]
[Authorize]
public sealed class FinanceTransactionsController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly IFinanceTransactionService _svc;

    public FinanceTransactionsController(ICurrentUserContext ctx, IFinanceTransactionService svc)
    {
        _ctx = ctx;
        _svc = svc;
    }

    /// <summary>
    /// Obtém a lista de transações do orçamento.
    /// </summary>
    /// <remarks>
    /// Pode filtrar por intervalo de datas usando <paramref name="from"/> e <paramref name="to"/>.
    /// A ordenação respeita a configuração do orçamento (mais recente primeiro ou mais antigo primeiro).
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="from">Data inicial (inclusive), opcional.</param>
    /// <param name="to">Data final (inclusive), opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Uma lista de transações.</returns>
    [HttpGet]
    public async Task<ActionResult<List<FinanceTransactionResponse>>> Get(
        Guid budgetId,
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        var rows = await _svc.GetAsync(_ctx.UserId, familyId, budgetId, from, to, ct);

        return Ok(rows.Select(ToResponse).ToList());
    }

    /// <summary>
    /// Obtém os totais do orçamento para o período corrente.
    /// </summary>
    /// <remarks>
    /// Calcula:
    /// <list type="bullet">
    /// <item><description>Rendimento do período</description></item>
    /// <item><description>Despesas do período</description></item>
    /// <item><description>Saldo do período</description></item>
    /// <item><description>Saldo do dia (hoje)</description></item>
    /// <item><description>Despesas totais (acumuladas)</description></item>
    /// </list>
    /// O período é determinado pela configuração do orçamento (recorrente) ou pelas datas do orçamento (único).
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="referenceDate">Data de referência (por omissão, hoje em UTC).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Os totais calculados.</returns>
    [HttpGet("totals")]
    public async Task<ActionResult<BudgetTotalsResponse>> Totals(
        Guid budgetId,
        [FromQuery] DateOnly? referenceDate,
        CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var t = await _svc.GetTotalsAsync(_ctx.UserId, familyId, budgetId, referenceDate, ct);

            return Ok(new BudgetTotalsResponse
            {
                Today = t.Today,
                PeriodStart = t.PeriodStart,
                PeriodEnd = t.PeriodEnd,
                IncomeThisPeriod = t.IncomeThisPeriod,
                ExpensesThisPeriod = t.ExpensesThisPeriod,
                BalanceThisPeriod = t.BalanceThisPeriod,
                BalanceToday = t.BalanceToday,
                TotalExpenses = t.TotalExpenses
            });
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Obtém um resumo por categorias (percentagem e total) para um tipo de transação.
    /// </summary>
    /// <remarks>
    /// Usa <paramref name="type"/> para escolher <c>Expense</c> (despesas) ou <c>Income</c> (rendimentos).
    /// O intervalo é opcional; quando omitido, considera todas as transações.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="type">Tipo de transação: <c>Expense</c> ou <c>Income</c>.</param>
    /// <param name="from">Data inicial (inclusive), opcional.</param>
    /// <param name="to">Data final (inclusive), opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de totais por categoria.</returns>
    [HttpGet("summary/categories")]
    public async Task<ActionResult<List<CategorySummaryResponse>>> SummaryByCategories(
        Guid budgetId,
        [FromQuery] string type = "Expense",
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        CancellationToken ct = default)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var rows = await _svc.GetCategorySummaryAsync(_ctx.UserId, familyId, budgetId, from, to, type, ct);

            return Ok(rows.Select(x => new CategorySummaryResponse
            {
                CategoryId = x.CategoryId,
                CategoryName = x.CategoryName,
                CategoryIconKey = x.CategoryIconKey,
                Total = x.Total,
                Percentage = x.Percentage
            }).ToList());
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Obtém um resumo por membros (percentagem e total) para um tipo de transação.
    /// </summary>
    /// <remarks>
    /// Agrupa por <c>Pago por</c> (membro que pagou/recebeu).
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="type">Tipo de transação: <c>Expense</c> ou <c>Income</c>.</param>
    /// <param name="from">Data inicial (inclusive), opcional.</param>
    /// <param name="to">Data final (inclusive), opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de totais por membro.</returns>
    [HttpGet("summary/members")]
    public async Task<ActionResult<List<MemberSummaryResponse>>> SummaryByMembers(
        Guid budgetId,
        [FromQuery] string type = "Expense",
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        CancellationToken ct = default)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var rows = await _svc.GetMemberSummaryAsync(_ctx.UserId, familyId, budgetId, from, to, type, ct);

            return Ok(rows.Select(x => new MemberSummaryResponse
            {
                UserId = x.UserId,
                Name = x.Name,
                Total = x.Total,
                Percentage = x.Percentage
            }).ToList());
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Obtém um resumo por contas (percentagem e total) para um tipo de transação.
    /// </summary>
    /// <remarks>
    /// Agrupa por conta (ex.: conta corrente, dinheiro, cartão de crédito).
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="type">Tipo de transação: <c>Expense</c> ou <c>Income</c>.</param>
    /// <param name="from">Data inicial (inclusive), opcional.</param>
    /// <param name="to">Data final (inclusive), opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de totais por conta.</returns>
    [HttpGet("summary/accounts")]
    public async Task<ActionResult<List<AccountSummaryResponse>>> SummaryByAccounts(
        Guid budgetId,
        [FromQuery] string type = "Expense",
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null,
        CancellationToken ct = default)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var rows = await _svc.GetAccountSummaryAsync(_ctx.UserId, familyId, budgetId, from, to, type, ct);

            return Ok(rows.Select(x => new AccountSummaryResponse
            {
                AccountId = x.AccountId,
                Name = x.Name,
                Total = x.Total,
                Percentage = x.Percentage
            }).ToList());
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Exporta as transações do orçamento para um ficheiro CSV.
    /// </summary>
    /// <remarks>
    /// O intervalo <paramref name="from"/>/<paramref name="to"/> é obrigatório.
    /// O delimitador por omissão é <c>;</c>.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="from">Data inicial (inclusive).</param>
    /// <param name="to">Data final (inclusive).</param>
    /// <param name="delimiter">Delimitador opcional (ex.: <c>;</c> ou <c>,</c>).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Um ficheiro CSV para download.</returns>
    [HttpGet("export")]
    public async Task<IActionResult> Export(
        Guid budgetId,
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromQuery] string? delimiter,
        CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            var file = await _svc.ExportCsvAsync(_ctx.UserId, familyId, budgetId, from, to, delimiter, ct);
            return File(file.Content, file.ContentType, file.FileName);
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Cria uma nova transação no orçamento.
    /// </summary>
    /// <remarks>
    /// A transação pode ser do tipo <c>Expense</c> (despesa) ou <c>Income</c> (rendimento), e deve ter categoria e conta
    /// válidas da família atual. Também pode ser marcada como paga e configurada com repetição/lembretes.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="request">Dados da transação a criar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A transação criada.</returns>
    [HttpPost]
    public async Task<ActionResult<FinanceTransactionResponse>> Create(Guid budgetId, CreateFinanceTransactionRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

            var repeatType = ParseEnum<TransactionRepeatType>(request.RepeatType, "RepeatType inválido.");
            var repeatUnit = ParseOptionalEnum<TransactionRepeatUnit>(request.RepeatUnit, "RepeatUnit inválido.");
            var reminderType = ParseEnum<TransactionReminderType>(request.ReminderType, "ReminderType inválido.");
            var reminderUnit = ParseOptionalEnum<TransactionReminderUnit>(request.ReminderUnit, "ReminderUnit inválido.");

            var input = new FinanceTransactionCreateInput(
                request.Amount,
                request.Title,
                request.Type,
                request.CategoryId,
                request.AccountId,
                request.PaidByUserId,
                request.Date,
                request.IsPaid,
                repeatType,
                request.RepeatInterval,
                repeatUnit,
                reminderType,
                request.ReminderValue,
                reminderUnit,
                request.Note
            );

            var created = await _svc.CreateAsync(_ctx.UserId, familyId, budgetId, input, ct);
            return Ok(ToResponse(created));
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Atualiza uma transação existente do orçamento.
    /// </summary>
    /// <remarks>
    /// Permite alterar valor, título, tipo, categoria, conta, data, estado de pago, repetição/lembretes e nota.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="transactionId">Identificador da transação.</param>
    /// <param name="request">Dados a atualizar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A transação atualizada.</returns>
    [HttpPatch("{transactionId:guid}")]
    public async Task<ActionResult<FinanceTransactionResponse>> Update(Guid budgetId, Guid transactionId, UpdateFinanceTransactionRequest request, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);

            var repeatType = request.RepeatType is null ? (TransactionRepeatType?)null : ParseEnum<TransactionRepeatType>(request.RepeatType, "RepeatType inválido.");
            var repeatUnit = ParseOptionalEnum<TransactionRepeatUnit>(request.RepeatUnit, "RepeatUnit inválido.");
            var reminderType = request.ReminderType is null ? (TransactionReminderType?)null : ParseEnum<TransactionReminderType>(request.ReminderType, "ReminderType inválido.");
            var reminderUnit = ParseOptionalEnum<TransactionReminderUnit>(request.ReminderUnit, "ReminderUnit inválido.");

            var input = new FinanceTransactionUpdateInput(
                request.Amount,
                request.Title,
                request.Type,
                request.CategoryId,
                request.AccountId,
                request.PaidByUserId,
                request.Date,
                request.IsPaid,
                repeatType,
                request.RepeatInterval,
                repeatUnit,
                reminderType,
                request.ReminderValue,
                reminderUnit,
                request.Note,
                request.NoteChangeRequested
            );

            var updated = await _svc.UpdateAsync(_ctx.UserId, familyId, budgetId, transactionId, input, ct);
            return Ok(ToResponse(updated));
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Elimina uma transação do orçamento.
    /// </summary>
    /// <remarks>
    /// Devolve <c>404 Not Found</c> se a transação não existir no orçamento indicado.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="transactionId">Identificador da transação.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpDelete("{transactionId:guid}")]
    public async Task<IActionResult> Delete(Guid budgetId, Guid transactionId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            await _svc.DeleteAsync(_ctx.UserId, familyId, budgetId, transactionId, ct);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Marca todas as transações do orçamento como pagas.
    /// </summary>
    /// <remarks>
    /// Útil para garantir consistência quando a preferência de cálculo considera apenas transações pagas.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpPost("mark-all-paid")]
    public async Task<IActionResult> MarkAllPaid(Guid budgetId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            await _svc.MarkAllPaidAsync(_ctx.UserId, familyId, budgetId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    /// <summary>
    /// Remove todas as transações do orçamento.
    /// </summary>
    /// <remarks>
    /// Esta ação é destrutiva e não pode ser revertida.
    /// </remarks>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Sem conteúdo se bem-sucedido.</returns>
    [HttpPost("clear")]
    public async Task<IActionResult> Clear(Guid budgetId, CancellationToken ct)
    {
        try
        {
            var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
            await _svc.ClearAsync(_ctx.UserId, familyId, budgetId, ct);
            return NoContent();
        }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    private static FinanceTransactionResponse ToResponse(FinanceTransactionModel t) => new()
    {
        Id = t.Id,
        BudgetId = t.BudgetId,
        Amount = t.Amount,
        Title = t.Title,
        Type = t.Type,
        CategoryId = t.CategoryId,
        CategoryName = t.CategoryName,
        CategoryIconKey = t.CategoryIconKey,
        AccountId = t.AccountId,
        AccountName = t.AccountName,
        AccountIconKey = t.AccountIconKey,
        PaidByUserId = t.PaidByUserId,
        PaidByUserName = t.PaidByUserName,
        Date = t.Date,
        IsPaid = t.IsPaid,
        PaidAtUtc = t.PaidAtUtc,
        RepeatType = t.RepeatType.ToString(),
        RepeatInterval = t.RepeatInterval,
        RepeatUnit = t.RepeatUnit?.ToString(),
        ReminderType = t.ReminderType.ToString(),
        ReminderValue = t.ReminderValue,
        ReminderUnit = t.ReminderUnit?.ToString(),
        Note = t.Note
    };

    private static TEnum ParseEnum<TEnum>(string value, string message) where TEnum : struct
    {
        if (!Enum.TryParse<TEnum>(value, true, out var parsed))
            throw new ArgumentException(message);
        return parsed;
    }

    private static TEnum? ParseOptionalEnum<TEnum>(string? value, string message) where TEnum : struct
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        if (!Enum.TryParse<TEnum>(value, true, out var parsed))
            throw new ArgumentException(message);
        return parsed;
    }
}
