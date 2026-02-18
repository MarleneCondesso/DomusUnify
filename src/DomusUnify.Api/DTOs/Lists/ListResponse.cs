namespace DomusUnify.Api.DTOs.Lists;

/// <summary>
/// Resposta com informação de uma lista.
/// </summary>
public sealed class ListResponse
{
    /// <summary>
    /// Identificador da lista.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nome da lista.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Tipo de lista (<c>Shopping</c>, <c>Tasks</c> ou <c>Custom</c>).
    /// </summary>
    public string Type { get; set; } = "Custom";

    /// <summary>
    /// Cor da lista em hexadecimal.
    /// </summary>
    public string ColorHex { get; set; } = "";

    /// <summary>
    /// Número total de itens na lista.
    /// </summary>
    public int ItemsCount { get; set; }

    /// <summary>
    /// Número de itens concluídos.
    /// </summary>
    public int CompletedCount { get; set; }
}
