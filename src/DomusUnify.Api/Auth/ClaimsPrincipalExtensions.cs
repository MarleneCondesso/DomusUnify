using System.Security.Claims;

namespace DomusUnify.Api.Auth;

/// <summary>
/// Extensões para ler informação do utilizador autenticado a partir de <see cref="ClaimsPrincipal"/>.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Obtém o identificador do utilizador autenticado a partir dos claims do token.
    /// </summary>
    /// <remarks>
    /// O identificador é esperado nos claims <see cref="ClaimTypes.NameIdentifier"/> (recomendado) ou <c>sub</c>.
    /// </remarks>
    /// <param name="user">Principal autenticado.</param>
    /// <returns>Identificador do utilizador.</returns>
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("sub");

        if (sub is null || !Guid.TryParse(sub, out var userId))
            throw new UnauthorizedAccessException("Token inválido: UserId não encontrado.");

        return userId;
    }
}
