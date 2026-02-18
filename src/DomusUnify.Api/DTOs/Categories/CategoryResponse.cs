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
    /// Chave do ícone da categoria.
    /// </summary>
    public string IconKey { get; set; } = null!;

    /// <summary>
    /// Ordem de apresentação.
    /// </summary>
    public int SortOrder { get; set; }
}
