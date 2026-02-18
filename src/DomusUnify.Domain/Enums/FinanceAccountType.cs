namespace DomusUnify.Domain.Enums;

/// <summary>
/// Define o tipo de conta financeira.
/// </summary>
public enum FinanceAccountType
{
    /// <summary>
    /// Conta à ordem / conta corrente.
    /// </summary>
    Checking = 0,

    /// <summary>
    /// Dinheiro (numerário).
    /// </summary>
    Cash = 1,

    /// <summary>
    /// Cartão de crédito.
    /// </summary>
    CreditCard = 2,

    /// <summary>
    /// Conta poupança.
    /// </summary>
    Savings = 3,

    /// <summary>
    /// Conta de crédito (linha de crédito/financiamento).
    /// </summary>
    Credit = 4,

    /// <summary>
    /// Conta conjunta.
    /// </summary>
    Joint = 5
}
