namespace DomusUnify.Api.DTOs.Calendar;

/// <summary>
/// Pedido para duplicar um evento numa nova data/hora.
/// </summary>
public sealed class DuplicateCalendarEventRequest
{
    /// <summary>
    /// Novo início (UTC) para o evento duplicado.
    /// </summary>
    public DateTime NewStartUtc { get; set; }

    /// <summary>
    /// Novo fim (UTC) para o evento duplicado.
    /// </summary>
    public DateTime NewEndUtc { get; set; }
}
