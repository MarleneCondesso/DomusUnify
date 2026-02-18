using DomusUnify.Application.Calendar.Models;

namespace DomusUnify.Application.Calendar;

/// <summary>
/// Serviço de definições do calendário (por família e por utilizador).
/// </summary>
public interface ICalendarSettingsService
{
    /// <summary>
    /// Obtém as definições de calendário da família.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Modelo com as definições atuais.</returns>
    Task<FamilyCalendarSettingsModel> GetFamilySettingsAsync(Guid userId, Guid familyId, CancellationToken ct);

    /// <summary>
    /// Atualiza as definições de calendário da família.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="model">Alterações a aplicar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Modelo com as definições após atualização.</returns>
    Task<FamilyCalendarSettingsModel> UpdateFamilySettingsAsync(Guid userId, Guid familyId, UpdateFamilyCalendarSettingsModel model, CancellationToken ct);

    /// <summary>
    /// Obtém as definições de calendário do utilizador.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Modelo com as definições atuais.</returns>
    Task<UserCalendarSettingsModel> GetUserSettingsAsync(Guid userId, CancellationToken ct);

    /// <summary>
    /// Atualiza as definições de calendário do utilizador.
    /// </summary>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="model">Alterações a aplicar.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Modelo com as definições após atualização.</returns>
    Task<UserCalendarSettingsModel> UpdateUserSettingsAsync(Guid userId, UpdateUserCalendarSettingsModel model, CancellationToken ct);

    /// <summary>
    /// Remove eventos antigos do calendário (limpeza).
    /// </summary>
    /// <remarks>
    /// A limpeza é feita com base num número de meses e/ou anos para trás.
    /// </remarks>
    /// <param name="userId">Identificador do utilizador autenticado.</param>
    /// <param name="familyId">Identificador da família.</param>
    /// <param name="months">Número de meses (opcional).</param>
    /// <param name="years">Número de anos (opcional).</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Número de eventos removidos.</returns>
    Task<int> CleanupAsync(Guid userId, Guid familyId, int? months, int? years, CancellationToken ct);
}
