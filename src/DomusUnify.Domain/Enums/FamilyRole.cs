namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define o papel/permissões de um utilizador numa família.
/// </summary>
public enum FamilyRole
{
    /// <summary>
    /// Administrador da família (permissões totais).
    /// </summary>
    Admin = 0,

    /// <summary>
    /// Membro com permissões de edição (consoante regras da aplicação).
    /// </summary>
    Member = 1,

    /// <summary>
    /// Apenas leitura (sem permissões de edição).
    /// </summary>
    Viewer = 2
}
