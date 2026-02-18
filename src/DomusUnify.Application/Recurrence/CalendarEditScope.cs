namespace DomusUnify.Application.Recurrence;

/// <summary>
/// Define o âmbito de edição de um evento recorrente.
/// </summary>
public enum CalendarEditScope
{
    /// <summary>
    /// Edita apenas a ocorrência atual.
    /// </summary>
    ThisOccurrence = 1,

    /// <summary>
    /// Edita todas as ocorrências (evento pai).
    /// </summary>
    AllOccurrences = 2,

    /// <summary>
    /// Edita a ocorrência atual e todas as futuras.
    /// </summary>
    ThisAndFuture = 3
}
