namespace DomusUnify.Api.DTOs.Categories;

/// <summary>
/// Pedido para criar uma nova categoria de itens (listas).
/// </summary>
public sealed class CreateCategoryRequest
{
    /// <summary>
    /// Nome da categoria.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da categoria.
    /// </summary>
    public string IconKey { get; set; } = "tag";
   // public string? ColorHex { get; set; }

    /// <summary>
    /// Ordem de apresentação (opcional).
    /// </summary>
    public int SortOrder { get; set; } = 0;
}
