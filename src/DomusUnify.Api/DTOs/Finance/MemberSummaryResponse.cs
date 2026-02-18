namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Resposta com resumo de despesas/rendimentos por membro (pago por).
/// </summary>
public sealed class MemberSummaryResponse
{
    /// <summary>
    /// Identificador do utilizador/membro.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Nome do membro.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Total agregado para o membro, no intervalo considerado.
    /// </summary>
    public decimal Total { get; set; }

    /// <summary>
    /// Percentagem do total em relação ao somatório do intervalo (0–100).
    /// </summary>
    public decimal Percentage { get; set; }
}
