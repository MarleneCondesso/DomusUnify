namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Resposta com resumo de despesas/rendimentos por categoria.
/// </summary>
public sealed class CategorySummaryResponse
{
    /// <summary>
    /// Identificador da categoria.
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Nome da categoria.
    /// </summary>
    public string CategoryName { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da categoria.
    /// </summary>
    public string CategoryIconKey { get; set; } = null!;

    /// <summary>
    /// Total agregado para a categoria, no intervalo considerado.
    /// </summary>
    public decimal Total { get; set; }

    /// <summary>
    /// Percentagem do total em relação ao somatório do intervalo (0–100).
    /// </summary>
    public decimal Percentage { get; set; }
}
