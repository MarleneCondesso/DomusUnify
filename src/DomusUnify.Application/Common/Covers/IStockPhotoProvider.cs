namespace DomusUnify.Application.Common.Covers;

/// <summary>
/// Abstração para obter uma foto "stock" (URL pública) a partir de uma query.
/// </summary>
public interface IStockPhotoProvider
{
    /// <summary>
    /// Tenta obter um URL de foto para a query.
    /// </summary>
    /// <param name="query">Texto de pesquisa (keywords).</param>
    /// <param name="seed">Seed estável para escolher uma foto de forma determinística.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>URL público da foto (ou null se não estiver configurado/sem resultados).</returns>
    Task<string?> TryGetPhotoUrlAsync(string query, int seed, CancellationToken ct);
}

