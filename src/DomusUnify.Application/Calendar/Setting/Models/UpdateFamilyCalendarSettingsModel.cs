namespace DomusUnify.Application.Calendar.Models;

/// <summary>
/// Modelo de atualização (parcial) das definições de calendário ao nível da família.
/// </summary>
/// <param name="CalendarColorHex">Nova cor padrão do calendário (opcional).</param>
/// <param name="HolidaysCountryCode">Novo código do país para feriados (opcional).</param>
/// <param name="DailyReminderEnabled">Ativa/desativa o lembrete diário (opcional).</param>
/// <param name="CleanupOlderThanMonths">Novo valor de limpeza por meses (opcional).</param>
/// <param name="CleanupOlderThanYears">Novo valor de limpeza por anos (opcional).</param>
public sealed record UpdateFamilyCalendarSettingsModel(
    string? CalendarColorHex,
    string? HolidaysCountryCode,
    bool? DailyReminderEnabled,
    int? CleanupOlderThanMonths,
    int? CleanupOlderThanYears
);
