namespace DomusUnify.Api.DTOs.Categories;

/// <summary>
/// Pedido para atualizar uma categoria de itens (listas).
/// </summary>
public sealed class UpdateCategoryRequest
{
    /// <summary>
    /// Novo nome da categoria (opcional).
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Novo tipo de lista associado (opcional).
    /// </summary>
    public string? Type { get; set; }

    /// <summary>
    /// Nova chave do ícone (opcional).
    /// </summary>
    public string? IconKey { get; set; }

    /// <summary>
    /// Nova ordem de apresentação (opcional).
    /// </summary>
    public int? SortOrder { get; set; }
}
