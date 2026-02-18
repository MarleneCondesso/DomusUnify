using DomusUnify.Domain.Entities;

namespace DomusUnify.Api.Services.Auth;

/// <summary>
/// Serviço responsável por emitir tokens JWT para autenticação.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Cria um token JWT para um utilizador.
    /// </summary>
    /// <param name="user">Utilizador autenticado.</param>
    /// <returns>Token JWT e a data/hora de expiração (UTC).</returns>
    (string token, DateTime expiresAtUtc) CreateToken(User user);
}
