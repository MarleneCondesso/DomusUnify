namespace DomusUnify.Api.Services.CurrentUser;

/// <summary>
/// Fornece informação sobre o utilizador autenticado e o contexto (família ativa).
/// </summary>
public interface ICurrentUserContext
{
    /// <summary>
    /// Identificador do utilizador autenticado.
    /// </summary>
    Guid UserId { get; }

    /// <summary>
    /// Obtém o identificador da família atualmente ativa para o utilizador autenticado.
    /// </summary>
    /// <remarks>
    /// A família ativa é usada como contexto padrão para endpoints que operam por família.
    /// </remarks>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Identificador da família ativa.</returns>
    Task<Guid> GetCurrentFamilyIdAsync(CancellationToken ct = default);
}
