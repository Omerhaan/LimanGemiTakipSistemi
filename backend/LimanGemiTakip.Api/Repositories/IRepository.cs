using System.Linq.Expressions;

namespace LimanGemiTakip.Api.Repositories;

public interface IRepository<T> where T : class
{
    IQueryable<T> Query();

    Task<List<T>> GetAllAsync();

    Task<T?> GetByIdAsync(int id);

    Task<T> AddAsync(T entity);

    Task<T> UpdateAsync(T entity);

    Task DeleteAsync(T entity);

    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
}
