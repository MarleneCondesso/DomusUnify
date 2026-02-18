namespace DomusUnify.Api.DTOs.Calendar;

/// <summary>
/// Pedido para copiar um evento para um conjunto de datas.
/// </summary>
public sealed class CopyCalendarEventRequest
{
    /// <summary>
    /// Datas (UTC) para as quais o evento deve ser copiado.
    /// </summary>
    /// <remarks>
    /// Limite máximo recomendado: 30 datas por pedido.
    /// </remarks>
    public List<DateOnly> DatesUtc { get; set; } = new();
}
