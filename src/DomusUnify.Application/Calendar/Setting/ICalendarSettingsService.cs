using DomusUnify.Application.Calendar.Models;
using DomusUnify.Domain.Entities;

public interface ICalendarSettingsService
{
    Task<FamilyCalendarSettingsModel> GetFamilySettingsAsync(Guid userId, Guid familyId, CancellationToken ct);
    Task<FamilyCalendarSettingsModel> UpdateFamilySettingsAsync(Guid userId, Guid familyId, UpdateFamilyCalendarSettingsModel model, CancellationToken ct);

    Task<UserCalendarSettingsModel> GetUserSettingsAsync(Guid userId, CancellationToken ct);
    Task<UserCalendarSettingsModel> UpdateUserSettingsAsync(Guid userId, UpdateUserCalendarSettingsModel model, CancellationToken ct);

    Task<int> CleanupAsync(Guid userId, Guid familyId, int? months, int? years, CancellationToken ct);
}
