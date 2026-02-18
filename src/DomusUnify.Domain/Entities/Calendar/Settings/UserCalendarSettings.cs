using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Definições de calendário ao nível do utilizador.
/// </summary>
public sealed class UserCalendarSettings : BaseEntity
{
    /// <summary>
    /// Identificador do utilizador.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Utilizador associado.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Hora do lembrete diário (por omissão 09:00).
    /// </summary>
    public TimeOnly DailyReminderTime { get; set; } = new(9, 0);

    /// <summary>
    /// Modo do lembrete diário.
    /// </summary>
    public DailyReminderMode DailyReminderMode { get; set; } = DailyReminderMode.SameDay;

    /// <summary>
    /// Lembrete por defeito para eventos, em minutos (opcional).
    /// </summary>
    public int? DefaultEventReminderMinutes { get; set; }
}
