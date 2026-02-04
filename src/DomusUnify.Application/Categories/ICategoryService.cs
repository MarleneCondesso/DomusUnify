using DomusUnify.Application.Categories.Models;

namespace DomusUnify.Application.Categories;

public interface ICategoryService
{

    // Item Categories
    Task<IReadOnlyList<CategoryModel>> GetItemCategoriesAsync(Guid userId, Guid familyId, CancellationToken ct);
    Task<CategoryModel> CreateItemCategoryAsync(Guid userId, Guid familyId, string name, string iconKey, int sortOrder, CancellationToken ct);
    Task<CategoryModel> UpdateItemCategoryAsync(Guid userId, Guid familyId, Guid categoryId, string? name, string? iconKey, int? sortOrder, CancellationToken ct);
    Task DeleteItemCategoryAsync(Guid userId, Guid familyId, Guid categoryId, CancellationToken ct);
}
