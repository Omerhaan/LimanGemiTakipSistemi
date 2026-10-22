using LimanGemiTakip.Api.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace LimanGemiTakip.Api.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    private readonly ApplicationDbContext _context;
    private readonly DbSet<T> _dbSet;

    public Repository(ApplicationDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public IQueryable<T> Query()
    {
        return _dbSet.AsQueryable();
    }

    public Task<List<T>> GetAllAsync()
    {
        return _dbSet.ToListAsync();
    }

    public Task<T?> GetByIdAsync(int id)
    {
        return _dbSet.FirstOrDefaultAsync(e => EF.Property<int>(e, "Id") == id);
    }

    public async Task<T> AddAsync(T entity)
    {
        _dbSet.Add(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task<T> UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    public async Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
    }

    public Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
        return _dbSet.AnyAsync(predicate);
    }
}
