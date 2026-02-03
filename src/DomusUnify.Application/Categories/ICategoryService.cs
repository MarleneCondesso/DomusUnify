using DomusUnify.Application.Categories.Models;

namespace DomusUnify.Application.Categories;

public interface ICategoryService
{
    // List Categories
    Task<IReadOnlyList<CategoryModel>> GetListCategoriesAsync(Guid userId, Guid familyId, CancellationToken ct);
    Task<CategoryModel> CreateListCategoryAsync(Guid userId, Guid familyId, string name, string iconKey, string? colorHex, int sortOrder, CancellationToken ct);
    Task<CategoryModel> UpdateListCategoryAsync(Guid userId, Guid familyId, Guid categoryId, string? name, string? iconKey, string? colorHex, int? sortOrder, CancellationToken ct);
    Task DeleteListCategoryAsync(Guid userId, Guid familyId, Guid categoryId, CancellationToken ct);

    // Item Categories
    Task<IReadOnlyList<CategoryModel>> GetItemCategoriesAsync(Guid userId, Guid familyId, CancellationToken ct);
    Task<CategoryModel> CreateItemCategoryAsync(Guid userId, Guid familyId, string name, string iconKey, string? colorHex, int sortOrder, CancellationToken ct);
    Task<CategoryModel> UpdateItemCategoryAsync(Guid userId, Guid familyId, Guid categoryId, string? name, string? iconKey, string? colorHex, int? sortOrder, CancellationToken ct);
    Task DeleteItemCategoryAsync(Guid userId, Guid familyId, Guid categoryId, CancellationToken ct);
}
