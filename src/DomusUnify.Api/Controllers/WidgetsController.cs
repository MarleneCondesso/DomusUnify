using DomusUnify.Api.DTOs.Widgets;
using DomusUnify.Api.Push;
using DomusUnify.Api.Services.CurrentUser;
using DomusUnify.Application.Budgets;
using DomusUnify.Application.Calendar;
using DomusUnify.Application.FinanceTransactions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DomusUnify.Api.Controllers;

/// <summary>
/// Endpoints de snapshot para widgets de calendário e orçamento.
/// </summary>
[ApiController]
[Route("api/v1/widgets")]
[Authorize]
public sealed class WidgetsController : ControllerBase
{
    private readonly ICurrentUserContext _ctx;
    private readonly ICalendarService _calendar;
    private readonly IBudgetService _budgets;
    private readonly IFinanceTransactionService _transactions;

    public WidgetsController(
        ICurrentUserContext ctx,
        ICalendarService calendar,
        IBudgetService budgets,
        IFinanceTransactionService transactions)
    {
        _ctx = ctx;
        _calendar = calendar;
        _budgets = budgets;
        _transactions = transactions;
    }

    /// <summary>
    /// Snapshot do widget de calendário com semana e eventos do dia.
    /// </summary>
    [HttpGet("calendar")]
    public async Task<ActionResult<CalendarWidgetSnapshotResponse>> GetCalendarWidget(
        [FromQuery] DateOnly? referenceDate,
        CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        var today = referenceDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var weekStart = StartOfWeek(today);
        var weekEnd = weekStart.AddDays(6);

        var weekEvents = await _calendar.GetEventsAsync(
            _ctx.UserId,
            familyId,
            weekStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            weekEnd.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            null,
            null,
            null,
            null,
            ct);

        var dailyEvents = await _calendar.GetEventsAsync(
            _ctx.UserId,
            familyId,
            null,
            null,
            today.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc),
            null,
            null,
            null,
            ct);

        var response = new CalendarWidgetSnapshotResponse
        {
            Today = today,
            WeekStart = weekStart,
            WeekEnd = weekEnd,
            LargeDeepLink = AppDeepLinks.CalendarWeek(familyId, today),
            SmallDeepLink = AppDeepLinks.CalendarDay(familyId, today),
            Week = Enumerable.Range(0, 7)
                .Select(offset =>
                {
                    var date = weekStart.AddDays(offset);
                    var items = weekEvents
                        .Where(e => DateOnly.FromDateTime(e.OccurrenceStartUtc) == date)
                        .OrderBy(e => e.OccurrenceStartUtc)
                        .Select(MapCalendarEvent)
                        .ToList();

                    return new CalendarWidgetDayResponse
                    {
                        Date = date,
                        IsToday = date == today,
                        EventCount = items.Count,
                        Events = items
                    };
                })
                .ToList(),
            DailyEvents = dailyEvents
                .OrderBy(e => e.OccurrenceStartUtc)
                .Select(MapCalendarEvent)
                .ToList()
        };

        return Ok(response);
    }

    /// <summary>
    /// Snapshot do widget pequeno de orçamento com despesas do mês e de hoje.
    /// </summary>
    [HttpGet("budget")]
    public async Task<ActionResult<BudgetWidgetSnapshotResponse>> GetBudgetWidget(
        [FromQuery] Guid? budgetId,
        [FromQuery] DateOnly? referenceDate,
        CancellationToken ct)
    {
        var familyId = await _ctx.GetCurrentFamilyIdAsync(ct);
        var today = referenceDate ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(today.Year, today.Month, 1);
        var monthEnd = new DateOnly(today.Year, today.Month, DateTime.DaysInMonth(today.Year, today.Month));

        var budgets = await _budgets.GetAsync(_ctx.UserId, familyId, ct);
        var selected = budgetId.HasValue
            ? budgets.FirstOrDefault(b => b.Id == budgetId.Value)
            : budgets
                .OrderBy(b => string.Equals(b.Type, "Recurring", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
                .ThenBy(b => b.Name)
                .FirstOrDefault();

        if (selected is null)
        {
            return Ok(new BudgetWidgetSnapshotResponse
            {
                HasBudget = false,
                Today = today,
                MonthStart = monthStart,
                MonthEnd = monthEnd,
                DeepLink = AppDeepLinks.Home(familyId)
            });
        }

        var snapshot = await _transactions.GetExpenseWidgetSnapshotAsync(_ctx.UserId, familyId, selected.Id, today, ct);

        return Ok(new BudgetWidgetSnapshotResponse
        {
            HasBudget = true,
            BudgetId = selected.Id,
            BudgetName = selected.Name,
            CurrencyCode = selected.CurrencyCode,
            Today = snapshot.Today,
            MonthStart = snapshot.MonthStart,
            MonthEnd = snapshot.MonthEnd,
            MonthExpenses = snapshot.MonthExpenses,
            TodayExpenses = snapshot.TodayExpenses,
            DeepLink = AppDeepLinks.Budget(familyId, selected.Id)
        });
    }

    private static CalendarWidgetEventResponse MapCalendarEvent(DomusUnify.Application.Calendar.Models.CalendarEventInstanceModel model)
    {
        return new CalendarWidgetEventResponse
        {
            EventId = model.EventId,
            ExceptionEventId = model.ExceptionEventId,
            Title = model.Title,
            StartUtc = model.OccurrenceStartUtc,
            EndUtc = model.OccurrenceEndUtc,
            IsAllDay = model.IsAllDay,
            ColorHex = model.ColorHex
        };
    }

    private static DateOnly StartOfWeek(DateOnly value)
    {
        var diff = ((int)value.DayOfWeek + 6) % 7;
        return value.AddDays(-diff);
    }
}
