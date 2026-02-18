namespace DomusUnify.Application.FinanceCategories.Models;

/// <summary>
/// Modelo de categoria financeira.
/// </summary>
/// <param name="Id">Identificador da categoria.</param>
/// <param name="Type">Tipo de categoria (<c>Expense</c> ou <c>Income</c>).</param>
/// <param name="Name">Nome da categoria.</param>
/// <param name="IconKey">Chave do ícone da categoria.</param>
/// <param name="SortOrder">Ordem de apresentação.</param>
public sealed record FinanceCategoryModel(
    Guid Id,
    string Type,
    string Name,
    string IconKey,
    int SortOrder
);
