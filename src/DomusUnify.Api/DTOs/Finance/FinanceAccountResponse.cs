namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Resposta com informação de uma conta financeira.
/// </summary>
public sealed class FinanceAccountResponse
{
    /// <summary>
    /// Identificador da conta.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Tipo de conta.
    /// </summary>
    public string Type { get; set; } = null!;

    /// <summary>
    /// Nome da conta.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da conta.
    /// </summary>
    public string IconKey { get; set; } = null!;

    /// <summary>
    /// Ordem de apresentação.
    /// </summary>
    public int SortOrder { get; set; }
}
