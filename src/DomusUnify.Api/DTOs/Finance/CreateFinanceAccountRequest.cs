namespace DomusUnify.Api.DTOs.Finance;

/// <summary>
/// Pedido para criar uma nova conta financeira.
/// </summary>
public sealed class CreateFinanceAccountRequest
{
    /// <summary>
    /// Tipo de conta (ex.: <c>Checking</c>, <c>Cash</c>, <c>CreditCard</c>, etc.).
    /// </summary>
    public string Type { get; set; } = "Checking";

    /// <summary>
    /// Nome da conta.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Chave do ícone da conta.
    /// </summary>
    public string IconKey { get; set; } = "credit-card";

    /// <summary>
    /// Ordem de apresentação.
    /// </summary>
    public int SortOrder { get; set; } = 0;
}
