using DomusUnify.Domain.Enums;

namespace DomusUnify.Application.Categories.Models;

/// <summary>
/// Modelo de categoria de itens (listas).
/// </summary>
/// <param name="Id">Identificador da categoria.</param>
/// <param name="Name">Nome da categoria.</param>
/// <param name="IconKey">Chave do ícone da categoria.</param>
/// <param name="ColorHex">Cor em hexadecimal (opcional).</param>
/// <param name="SortOrder">Ordem de apresentação.</param>
public sealed record CategoryModel(
    Guid Id,
    string Name,
    ListType Type,
    string IconKey,
    string? ColorHex,
    int SortOrder
);
