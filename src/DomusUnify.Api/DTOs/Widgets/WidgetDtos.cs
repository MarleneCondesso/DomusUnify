namespace DomusUnify.Api.DTOs.Widgets;

/// <summary>
/// Snapshot de dados do widget de calendário.
/// </summary>
public sealed class CalendarWidgetSnapshotResponse
{
    /// <summary>
    /// Dia de referência.
    /// </summary>
    public DateOnly Today { get; set; }

    /// <summary>
    /// Início da semana visível.
    /// </summary>
    public DateOnly WeekStart { get; set; }

    /// <summary>
    /// Fim da semana visível.
    /// </summary>
    public DateOnly WeekEnd { get; set; }

    /// <summary>
    /// Deep link para abrir a app em vista semanal.
    /// </summary>
    public string LargeDeepLink { get; set; } = "";

    /// <summary>
    /// Deep link para abrir a app em vista diária.
    /// </summary>
    public string SmallDeepLink { get; set; } = "";

    /// <summary>
    /// Dias da semana e respetivos eventos.
    /// </summary>
    public List<CalendarWidgetDayResponse> Week { get; set; } = [];

    /// <summary>
    /// Eventos do dia atual para o widget pequeno.
    /// </summary>
    public List<CalendarWidgetEventResponse> DailyEvents { get; set; } = [];
}

/// <summary>
/// Dados por dia para o widget de calendário.
/// </summary>
public sealed class CalendarWidgetDayResponse
{
    /// <summary>
    /// Data do dia.
    /// </summary>
    public DateOnly Date { get; set; }

    /// <summary>
    /// Indica se corresponde ao dia atual.
    /// </summary>
    public bool IsToday { get; set; }

    /// <summary>
    /// Número total de eventos no dia.
    /// </summary>
    public int EventCount { get; set; }

    /// <summary>
    /// Eventos do dia.
    /// </summary>
    public List<CalendarWidgetEventResponse> Events { get; set; } = [];
}

/// <summary>
/// Evento simplificado para widgets.
/// </summary>
public sealed class CalendarWidgetEventResponse
{
    /// <summary>
    /// Identificador do evento base.
    /// </summary>
    public Guid EventId { get; set; }

    /// <summary>
    /// Identificador da exceção, quando aplicável.
    /// </summary>
    public Guid? ExceptionEventId { get; set; }

    /// <summary>
    /// Título do evento.
    /// </summary>
    public string Title { get; set; } = "";

    /// <summary>
    /// Data/hora de início.
    /// </summary>
    public DateTime StartUtc { get; set; }

    /// <summary>
    /// Data/hora de fim.
    /// </summary>
    public DateTime EndUtc { get; set; }

    /// <summary>
    /// Indica se é um evento de dia inteiro.
    /// </summary>
    public bool IsAllDay { get; set; }

    /// <summary>
    /// Cor opcional do evento.
    /// </summary>
    public string? ColorHex { get; set; }
}

/// <summary>
/// Snapshot de dados do widget pequeno de orçamento.
/// </summary>
public sealed class BudgetWidgetSnapshotResponse
{
    /// <summary>
    /// Indica se existe um orçamento disponível.
    /// </summary>
    public bool HasBudget { get; set; }

    /// <summary>
    /// Identificador do orçamento escolhido.
    /// </summary>
    public Guid? BudgetId { get; set; }

    /// <summary>
    /// Nome do orçamento.
    /// </summary>
    public string? BudgetName { get; set; }

    /// <summary>
    /// Código da moeda.
    /// </summary>
    public string? CurrencyCode { get; set; }

    /// <summary>
    /// Dia de referência.
    /// </summary>
    public DateOnly Today { get; set; }

    /// <summary>
    /// Início do mês visível.
    /// </summary>
    public DateOnly MonthStart { get; set; }

    /// <summary>
    /// Fim do mês visível.
    /// </summary>
    public DateOnly MonthEnd { get; set; }

    /// <summary>
    /// Total de despesas do mês.
    /// </summary>
    public decimal MonthExpenses { get; set; }

    /// <summary>
    /// Total de despesas de hoje.
    /// </summary>
    public decimal TodayExpenses { get; set; }

    /// <summary>
    /// Deep link para abrir a app no orçamento.
    /// </summary>
    public string DeepLink { get; set; } = "";
}
