namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Pedido para atualizar uma categoria financeira.
/// </summary>
public sealed class UpdateFinanceCategoryRequest
{
    /// <summary>
    /// Novo nome (opcional).
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Nova chave do ícone (opcional).
    /// </summary>
    public string? IconKey { get; set; }

    /// <summary>
    /// Nova ordem de apresentação (opcional).
    /// </summary>
    public int? SortOrder { get; set; }
}
