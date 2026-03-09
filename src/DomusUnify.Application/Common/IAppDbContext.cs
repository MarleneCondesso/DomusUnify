using DomusUnify.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DomusUnify.Application.Common.Interfaces;

/// <summary>
/// Abstração do <see cref="DbContext"/> para a camada de aplicação.
/// </summary>
/// <remarks>
/// Expõe os <see cref="DbSet{TEntity}"/> necessários para as operações de negócio, permitindo testes e
/// desacoplamento da infraestrutura.
/// </remarks>
public interface IAppDbContext
{
    /// <summary>
    /// Conjunto de utilizadores.
    /// </summary>
    DbSet<User> Users { get; }

    /// <summary>
    /// Conjunto de famílias.
    /// </summary>
    DbSet<Domain.Entities.Family> Families { get; }

    /// <summary>
    /// Conjunto de membros de família (associações utilizador↔família).
    /// </summary>
    DbSet<FamilyMember> FamilyMembers { get; }

    /// <summary>
    /// Conjunto de convites para aderir a uma família.
    /// </summary>
    DbSet<FamilyInvite> FamilyInvites { get; }

    /// <summary>
    /// Conjunto de listas partilhadas.
    /// </summary>
    DbSet<SharedList> Lists { get; }

    /// <summary>
    /// Conjunto de acessos de utilizadores a listas (quando a visibilidade é por membros específicos).
    /// </summary>
    DbSet<SharedListUserAccess> ListUserAccess { get; }

    /// <summary>
    /// Conjunto de itens de listas.
    /// </summary>
    DbSet<ListItem> ListItems { get; }

    /// <summary>
    /// Conjunto de entradas de atividade (feed) da família.
    /// </summary>
    DbSet<ActivityEntry> ActivityEntries { get; }

    /// <summary>
    /// Conjunto de estados de notificações (por utilizador e família).
    /// </summary>
    DbSet<UserNotificationState> UserNotificationStates { get; }

    /// <summary>
    /// Conjunto de subscrições Web Push por utilizador/dispositivo.
    /// </summary>
    DbSet<WebPushSubscription> WebPushSubscriptions { get; }

    /// <summary>
    /// Conjunto de refresh tokens persistidos por utilizador/dispositivo.
    /// </summary>
    DbSet<UserRefreshToken> UserRefreshTokens { get; }

    /// <summary>
    /// Conjunto de categorias de itens (listas).
    /// </summary>
    DbSet<ItemCategory> ItemCategories { get; }

    /// <summary>
    /// Conjunto de eventos de calendário.
    /// </summary>
    DbSet<CalendarEvent> CalendarEvents { get; }

    /// <summary>
    /// Conjunto de participantes de eventos de calendário.
    /// </summary>
    DbSet<CalendarEventParticipant> CalendarEventParticipants { get; }

    /// <summary>
    /// Conjunto de regras de visibilidade de eventos de calendário.
    /// </summary>
    DbSet<CalendarEventVisibility> CalendarEventVisibilities { get; }

    /// <summary>
    /// Conjunto de lembretes associados a eventos de calendário.
    /// </summary>
    DbSet<CalendarEventReminder> CalendarEventReminders { get; }

    /// <summary>
    /// Conjunto de definições de calendário ao nível da família.
    /// </summary>
    DbSet<FamilyCalendarSettings> FamilyCalendarSettings { get; }

    /// <summary>
    /// Conjunto de definições de calendário ao nível do utilizador.
    /// </summary>
    DbSet<UserCalendarSettings> UserCalendarSettings { get; }

    /// <summary>
    /// Conjunto de orçamentos.
    /// </summary>
    DbSet<Budget> Budgets { get; }

    /// <summary>
    /// Conjunto de acessos de utilizadores a orçamentos.
    /// </summary>
    DbSet<BudgetUserAccess> BudgetUserAccess { get; }

    /// <summary>
    /// Conjunto de definições de utilizador por orçamento.
    /// </summary>
    DbSet<BudgetUserSettings> BudgetUserSettings { get; }

    /// <summary>
    /// Conjunto de limites por categoria (despesas) num orçamento.
    /// </summary>
    DbSet<BudgetCategoryLimit> BudgetCategoryLimits { get; }

    /// <summary>
    /// Conjunto de contas financeiras ocultadas num orçamento.
    /// </summary>
    DbSet<BudgetHiddenFinanceAccount> BudgetHiddenFinanceAccounts { get; }

    /// <summary>
    /// Conjunto de categorias financeiras (despesas/rendimentos).
    /// </summary>
    DbSet<FinanceCategory> FinanceCategories { get; }

    /// <summary>
    /// Conjunto de contas financeiras.
    /// </summary>
    DbSet<FinanceAccount> FinanceAccounts { get; }

    /// <summary>
    /// Conjunto de transações financeiras.
    /// </summary>
    DbSet<FinanceTransaction> FinanceTransactions { get; }

    /// <summary>
    /// Persiste alterações pendentes na base de dados.
    /// </summary>
    /// <param name="cancellationToken">Token de cancelamento.</param>
    /// <returns>Número de entidades afetadas.</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
