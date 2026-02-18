using DomusUnify.Domain.Common;
using DomusUnify.Domain.Enums;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma despesa simples associada a uma família.
/// </summary>
public class Expense : BaseEntity
{
    /// <summary>
    /// Identificador da família.
    /// </summary>
    public Guid FamilyId { get; set; }

    /// <summary>
    /// Família associada.
    /// </summary>
    public Family Family { get; set; } = null!;

    /// <summary>
    /// Valor monetário da despesa.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Categoria da despesa.
    /// </summary>
    public ExpenseCategory Category { get; set; } = ExpenseCategory.Other;

    /// <summary>
    /// Descrição opcional da despesa.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Data/hora da despesa (UTC).
    /// </summary>
    public DateTime DateUtc { get; set; }

    /// <summary>
    /// Identificador do utilizador que criou o registo.
    /// </summary>
    public Guid CreatedByUserId { get; set; }

    /// <summary>
    /// Utilizador que criou o registo.
    /// </summary>
    public User CreatedByUser { get; set; } = null!;
}
