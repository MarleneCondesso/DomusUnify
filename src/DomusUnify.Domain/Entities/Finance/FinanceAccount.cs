using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma conta financeira na família (ex.: conta corrente, numerário, cartão de crédito).
/// </summary>
public sealed class FinanceAccount : BaseEntity
{
    /// <summary>
    /// Identificador da família.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Tipo de conta.
    /// </summary>
    public FinanceAccountType Type { get; set; } = FinanceAccountType.Checking;

    /// <summary>
    /// Nome da conta.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da conta.
    /// </summary>
    public string IconKey { get; set; } = "credit-card";

    /// <summary>
    /// Ordem de apresentação.
    /// </summary>
    public int SortOrder { get; set; } = 0;
}
