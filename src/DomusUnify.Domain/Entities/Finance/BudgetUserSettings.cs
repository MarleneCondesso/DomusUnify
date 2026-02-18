using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa definições específicas de um utilizador num orçamento.
/// </summary>
public sealed class BudgetUserSettings : BaseEntity
{
    /// <summary>
    /// Identificador do orçamento.
    /// </summary>
    public Guid BudgetId { get; set; }

    /// <summary>
    /// Orçamento associado.
    /// </summary>
    public Budget Budget { get; set; } = null!;

    /// <summary>
    /// Identificador do utilizador.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Utilizador associado.
    /// </summary>
    public User User { get; set; } = null!;

    /// <summary>
    /// Indica se o lembrete diário de transações está ativo para este orçamento.
    /// </summary>
    public bool DailyReminderEnabled { get; set; } = false;

    /// <summary>
    /// Hora do lembrete diário (por omissão 21:00).
    /// </summary>
    public TimeOnly DailyReminderTime { get; set; } = new(21, 0);
}
