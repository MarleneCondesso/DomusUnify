namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Pedido para atualizar uma conta financeira.
/// </summary>
public sealed class UpdateFinanceAccountRequest
{
    /// <summary>
    /// Novo nome (opcional).
    /// </summary>
    public string? Name { get; set; }

    /// <summary>
    /// Nova chave do ícone (opcional).
    /// </summary>
    public string? IconKey { get; set; }

    /// <summary>
    /// Nova ordem de apresentação (opcional).
    /// </summary>
    public int? SortOrder { get; set; }
}
