namespace DomusUnify.Api.DTOs.Categories;

/// <summary>
/// Resposta com informação de uma categoria de itens (listas).
/// </summary>
public sealed class CategoryResponse
{
    /// <summary>
    /// Identificador da categoria.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Nome da categoria.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Tipo de lista ao qual esta categoria pertence (<c>Shopping</c>, <c>Tasks</c> ou <c>Custom</c>).
    /// </summary>
    public string Type { get; set; } = "Custom";

    /// <summary>
    /// Chave do ícone da categoria.
    /// </summary>
    public string IconKey { get; set; } = null!;

    /// <summary>
    /// Ordem de apresentação.
    /// </summary>
    public int SortOrder { get; set; }
}
