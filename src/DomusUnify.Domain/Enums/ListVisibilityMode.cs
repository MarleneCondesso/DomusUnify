namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define a visibilidade e acesso de uma lista dentro da famÃ­lia.
/// </summary>
public enum ListVisibilityMode
{
    /// <summary>
    /// Apenas o proprietÃ¡rio (criador) tem acesso.
    /// </summary>
    Private = 0,

    /// <summary>
    /// Todos os membros da famÃ­lia tÃªm acesso.
    /// </summary>
    AllMembers = 1,

    /// <summary>
    /// Apenas membros especÃ­ficos tÃªm acesso.
    /// </summary>
    SpecificMembers = 2
}

