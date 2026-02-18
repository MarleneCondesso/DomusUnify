namespace DomusUnify.Api.DTOs.Budgets;

/// <summary>
/// Resposta com informação de um membro associado ao orçamento.
/// </summary>
public sealed class BudgetMemberResponse
{
    /// <summary>
    /// Identificador do utilizador.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Nome do utilizador.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Papel do utilizador no contexto do orçamento/família.
    /// </summary>
    public string Role { get; set; } = null!;
}
