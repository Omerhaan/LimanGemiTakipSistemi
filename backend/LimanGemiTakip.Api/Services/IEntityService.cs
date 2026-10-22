using LimanGemiTakip.Api.Models.Common;

namespace LimanGemiTakip.Api.Services;

public interface IEntityService<T> where T : class
{
    Task<List<T>> GetAllAsync();

    Task<PagedResult<T>> GetPagedAsync(PaginationParams paginationParams);

    Task<T?> GetByIdAsync(int id);

    Task<T> CreateAsync(T entity);

    Task<T?> UpdateAsync(int id, T entity);

    Task<bool> DeleteAsync(int id);
}
