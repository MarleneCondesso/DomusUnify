namespace DomusUnify.Application.FinanceAccounts.Models;

/// <summary>
/// Modelo de conta financeira.
/// </summary>
/// <param name="Id">Identificador da conta.</param>
/// <param name="Type">Tipo de conta (ex.: <c>Checking</c>, <c>Cash</c>, <c>CreditCard</c>, etc.).</param>
/// <param name="Name">Nome da conta.</param>
/// <param name="IconKey">Chave do ícone da conta.</param>
/// <param name="SortOrder">Ordem de apresentação.</param>
public sealed record FinanceAccountModel(
    Guid Id,
    string Type,
    string Name,
    string IconKey,
    int SortOrder
);
