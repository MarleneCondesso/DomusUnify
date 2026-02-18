using DomusUnify.Application.FinanceTransactions.Models;

namespace DomusUnify.Application.FinanceTransactions;

/// <summary>
/// Serviço de transações financeiras dentro de um orçamento.
/// </summary>
public interface IFinanceTransactionService
{
    /// <summary>
    /// Obtém transações do orçamento, com filtro opcional por intervalo de datas.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="from">Data inicial (inclusive), opcional.</param>
    /// <param name="to">Data final (inclusive), opcional.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de transações.</returns>
    Task<IReadOnlyList<FinanceTransactionModel>> GetAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        CancellationToken ct);

    /// <summary>
    /// Cria uma nova transação no orçamento.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="input">Dados de criação.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A transação criada.</returns>
    Task<FinanceTransactionModel> CreateAsync(Guid userId, Guid familyId, Guid budgetId, FinanceTransactionCreateInput input, CancellationToken ct);

    /// <summary>
    /// Atualiza uma transação existente.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="transactionId">Identificador da transação.</param>
    /// <param name="input">Dados a atualizar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>A transação atualizada.</returns>
    Task<FinanceTransactionModel> UpdateAsync(Guid userId, Guid familyId, Guid budgetId, Guid transactionId, FinanceTransactionUpdateInput input, CancellationToken ct);

    /// <summary>
    /// Elimina uma transação.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="transactionId">Identificador da transação.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task DeleteAsync(Guid userId, Guid familyId, Guid budgetId, Guid transactionId, CancellationToken ct);

    /// <summary>
    /// Obtém os totais do orçamento para o período corrente (e saldo do dia).
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="referenceDate">Data de referência (por omissão, hoje).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Totais calculados.</returns>
    Task<BudgetTotalsModel> GetTotalsAsync(Guid userId, Guid familyId, Guid budgetId, DateOnly? referenceDate, CancellationToken ct);

    /// <summary>
    /// Obtém um resumo por categorias para um tipo de transação.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="from">Data inicial (inclusive), opcional.</param>
    /// <param name="to">Data final (inclusive), opcional.</param>
    /// <param name="type">Tipo: <c>Expense</c> ou <c>Income</c>.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de totais por categoria.</returns>
    Task<IReadOnlyList<CategorySummaryModel>> GetCategorySummaryAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        string type,
        CancellationToken ct);

    /// <summary>
    /// Obtém um resumo por membros (pago por) para um tipo de transação.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="from">Data inicial (inclusive), opcional.</param>
    /// <param name="to">Data final (inclusive), opcional.</param>
    /// <param name="type">Tipo: <c>Expense</c> ou <c>Income</c>.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de totais por membro.</returns>
    Task<IReadOnlyList<MemberSummaryModel>> GetMemberSummaryAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        string type,
        CancellationToken ct);

    /// <summary>
    /// Obtém um resumo por contas para um tipo de transação.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="from">Data inicial (inclusive), opcional.</param>
    /// <param name="to">Data final (inclusive), opcional.</param>
    /// <param name="type">Tipo: <c>Expense</c> ou <c>Income</c>.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Lista de totais por conta.</returns>
    Task<IReadOnlyList<AccountSummaryModel>> GetAccountSummaryAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly? from,
        DateOnly? to,
        string type,
        CancellationToken ct);

    /// <summary>
    /// Exporta as transações do orçamento para CSV.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="from">Data inicial (inclusive).</param>
    /// <param name="to">Data final (inclusive).</param>
    /// <param name="delimiter">Delimitador opcional (por omissão, <c>;</c>).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Conteúdo e metadados do ficheiro CSV.</returns>
    Task<CsvExportModel> ExportCsvAsync(
        Guid userId,
        Guid familyId,
        Guid budgetId,
        DateOnly from,
        DateOnly to,
        string? delimiter,
        CancellationToken ct);

    /// <summary>
    /// Marca todas as transações do orçamento como pagas.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task MarkAllPaidAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);

    /// <summary>
    /// Remove todas as transações do orçamento.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="budgetId">Identificador do orçamento.</param>
    /// <param name="ct">Token de cancelamento.</param>
    Task ClearAsync(Guid userId, Guid familyId, Guid budgetId, CancellationToken ct);
}
