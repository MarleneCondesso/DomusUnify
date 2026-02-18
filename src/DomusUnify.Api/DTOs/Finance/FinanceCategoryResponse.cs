namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Resposta com informação de uma categoria financeira.
/// </summary>
public sealed class FinanceCategoryResponse
{
    /// <summary>
    /// Identificador da categoria.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Tipo de categoria (<c>Expense</c> ou <c>Income</c>).
    /// </summary>
    public string Type { get; set; } = null!;

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
