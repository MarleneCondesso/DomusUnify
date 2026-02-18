namespace DomusUnify.Application.Family;

/// <summary>
/// Serviço responsável pela gestão de convites para adesão a uma família.
/// </summary>
/// <remarks>
/// Permite criar convites, pré-visualizar a informação associada e aceitar um convite, aplicando regras como
/// expiração, revogação e limites de utilização.
/// </remarks>
public interface IFamilyInviteService
{
    /// <summary>
    /// Cria um novo convite para a família.
    /// </summary>
    /// <param name="userId">Identificador do utilizador que cria o convite.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="daysValid">Número de dias de validade do convite.</param>
    /// <param name="maxUses">Número máximo de utilizações (opcional).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Dados do convite criado.</returns>
    Task<CreateInviteResult> CreateInviteAsync(Guid userId, Guid familyId, int daysValid, int? maxUses, CancellationToken ct);

    /// <summary>
    /// Obtém uma pré-visualização de um convite.
    /// </summary>
    /// <remarks>
    /// Não consome utilizações do convite; serve apenas para validação e exibição de informação.
    /// </remarks>
    /// <param name="userId">Identificador do utilizador que está a pré-visualizar o convite.</param>
    /// <param name="token">Token do convite.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Informação de pré-visualização do convite.</returns>
    Task<InvitePreviewModel> PreviewInviteAsync(Guid userId, string token, CancellationToken ct);

    /// <summary>
    /// Aceita um convite e adiciona o utilizador à família.
    /// </summary>
    /// <remarks>
    /// Caso o utilizador já seja membro da família, o método não cria nova associação e pode não incrementar o
    /// contador de utilizações do convite, consoante a implementação.
    /// </remarks>
    /// <param name="userId">Identificador do utilizador que está a aceitar o convite.</param>
    /// <param name="token">Token do convite.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task JoinByInviteAsync(Guid userId, string token, CancellationToken ct);
}
