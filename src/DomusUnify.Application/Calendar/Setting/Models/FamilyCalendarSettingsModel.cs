namespace DomusUnify.Application.Calendar.Models;

/// <summary>
/// Modelo com definições de calendário ao nível da família.
/// </summary>
/// <param name="CalendarColorHex">Cor padrão do calendário em hexadecimal (opcional).</param>
/// <param name="HolidaysCountryCode">Código do país para feriados (ex.: <c>PT</c>).</param>
/// <param name="DailyReminderEnabled">Indica se o lembrete diário está ativo.</param>
/// <param name="CleanupOlderThanMonths">Remoção automática de eventos antigos após X meses (opcional).</param>
/// <param name="CleanupOlderThanYears">Remoção automática de eventos antigos após X anos (opcional).</param>
public sealed record FamilyCalendarSettingsModel(
    string? CalendarColorHex,
    string HolidaysCountryCode,
    bool DailyReminderEnabled,
    int? CleanupOlderThanMonths,
    int? CleanupOlderThanYears
);
