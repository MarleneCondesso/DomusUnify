using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Definições de calendário ao nível da família.
/// </summary>
public sealed class FamilyCalendarSettings : BaseEntity
{
    /// <summary>
    /// Identificador da família.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Cor padrão do calendário em hexadecimal (ex.: <c>#FFAA00</c>), opcional.
    /// </summary>
    public string? CalendarColorHex { get; set; }

    /// <summary>
    /// Código do país para feriados (ex.: <c>PT</c>).
    /// </summary>
    public string HolidaysCountryCode { get; set; } = "PT";

    /// <summary>
    /// Limpeza automática de eventos antigos após X meses (opcional).
    /// </summary>
    public int? CleanupOlderThanMonths { get; set; }

    /// <summary>
    /// Limpeza automática de eventos antigos após X anos (opcional).
    /// </summary>
    public int? CleanupOlderThanYears { get; set; }

    /// <summary>
    /// Indica se o lembrete diário global está ativo.
    /// </summary>
    public bool DailyReminderEnabled { get; set; }
}
