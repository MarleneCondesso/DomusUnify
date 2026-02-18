using DomusUnify.Domain.Common;

namespace DomusUnify.Domain.Entities;

/// <summary>
/// Representa uma família (grupo) dentro da aplicação.
/// </summary>
public class Family : BaseEntity
{
    /// <summary>
    /// Nome da família.
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Membros da família.
    /// </summary>
    public ICollection<FamilyMember> Members { get; set; } = new List<FamilyMember>();

    /// <summary>
    /// Eventos de calendário associados à família.
    /// </summary>
    public ICollection<CalendarEvent> CalendarEvents { get; set; } = new List<CalendarEvent>();

    /// <summary>
    /// Listas partilhadas da família.
    /// </summary>
    public ICollection<SharedList> Lists { get; set; } = new List<SharedList>();

    // Finanças / Orçamento
    /// <summary>
    /// Orçamentos da família.
    /// </summary>
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();

    /// <summary>
    /// Categorias financeiras da família.
    /// </summary>
    public ICollection<FinanceCategory> FinanceCategories { get; set; } = new List<FinanceCategory>();

    /// <summary>
    /// Contas financeiras da família.
    /// </summary>
    public ICollection<FinanceAccount> FinanceAccounts { get; set; } = new List<FinanceAccount>();
}
