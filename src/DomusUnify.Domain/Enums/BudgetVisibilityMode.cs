namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define a visibilidade e acesso de um orçamento dentro da família.
/// </summary>
public enum BudgetVisibilityMode
{
    /// <summary>
    /// Apenas o proprietário tem acesso.
    /// </summary>
    Private = 0,

    /// <summary>
    /// Todos os membros da família têm acesso.
    /// </summary>
    AllMembers = 1,

    /// <summary>
    /// Apenas membros específicos têm acesso.
    /// </summary>
    SpecificMembers = 2
}
