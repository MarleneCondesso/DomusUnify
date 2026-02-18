namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Resposta com resumo de despesas/rendimentos por conta.
/// </summary>
public sealed class AccountSummaryResponse
{
    /// <summary>
    /// Identificador da conta.
    /// </summary>
    public Guid AccountId { get; set; }

    /// <summary>
    /// Nome da conta.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Total agregado para a conta, no intervalo considerado.
    /// </summary>
    public decimal Total { get; set; }

    /// <summary>
    /// Percentagem do total em relação ao somatório do intervalo (0–100).
    /// </summary>
    public decimal Percentage { get; set; }
}
