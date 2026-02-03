using DomusUnify.Application.Lists.Models;

namespace DomusUnify.Application.Lists;

public interface IListService
{
    Task<IReadOnlyList<ListSummary>> GetListsAsync(Guid userId, Guid familyId, CancellationToken ct);
    Task<ListSummary> CreateListAsync(Guid userId, Guid familyId, string name, string type, CancellationToken ct);
    Task RenameListAsync(Guid userId, Guid familyId, Guid listId, string newName, CancellationToken ct);
    Task DeleteListAsync(Guid userId, Guid familyId, Guid listId, CancellationToken ct);

    Task<IReadOnlyList<ListItemModel>> GetItemsAsync(Guid userId, Guid familyId, Guid listId, CancellationToken ct);

    Task<ListItemModel> AddItemAsync(Guid userId, Guid familyId, Guid listId, string name, Guid? categoryId, CancellationToken ct);

    // ✅ novo update completo
    Task UpdateItemAsync(
        Guid userId,
        Guid familyId,
        Guid itemId,
        string? name,
        bool? isCompleted,
        bool categoryChangeRequested,
        Guid? categoryId,
        CancellationToken ct);

    Task DeleteItemAsync(Guid userId, Guid familyId, Guid itemId, CancellationToken ct);
}
