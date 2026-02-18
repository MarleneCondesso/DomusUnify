namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Pedido para criar uma nova categoria financeira.
/// </summary>
public sealed class CreateFinanceCategoryRequest
{
    /// <summary>
    /// Tipo de categoria (<c>Expense</c> ou <c>Income</c>).
    /// </summary>
    public string Type { get; set; } = "Expense";

    /// <summary>
    /// Nome da categoria.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da categoria.
    /// </summary>
    public string IconKey { get; set; } = "tag";

    /// <summary>
    /// Ordem de apresentação.
    /// </summary>
    public int SortOrder { get; set; } = 0;
}
