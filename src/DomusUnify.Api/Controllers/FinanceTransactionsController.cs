using DomusUnify.Api.DTOs.Finance;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.FinanceTransactions;
using DomusUnify.Application.FinanceTransactions.Models;
using DomusUnify.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

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

