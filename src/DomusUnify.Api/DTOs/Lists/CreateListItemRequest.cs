namespace DomusUnify.Api.DTOs.Lists;

/// <summary>
/// Pedido para criar um novo item numa lista.
/// </summary>
public sealed class CreateListItemRequest
{
    /// <summary>
    /// Nome do item.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Identificador da categoria do item (opcional).
    /// </summary>
    public Guid? CategoryId { get; set; }
}
