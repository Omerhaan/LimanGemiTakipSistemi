using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Common;
using LimanGemiTakip.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Services;

public class PortService : IPortService
{
    private readonly IRepository<Port> _repository;

    public PortService(IRepository<Port> repository)
    {
        _repository = repository;
    }

    public Task<List<Port>> GetAllAsync() => _repository.GetAllAsync();

    public async Task<PagedResult<Port>> GetPagedAsync(PaginationParams paginationParams)
    {
        var query = _repository.Query();

        if (!string.IsNullOrWhiteSpace(paginationParams.SearchTerm))
        {
            var term = paginationParams.SearchTerm.Trim();
            query = query.Where(p => p.Name.Contains(term) ||
                                     p.Code.Contains(term) ||
                                     p.City.Contains(term) ||
                                     p.Country.Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(p => p.Name)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();

        return new PagedResult<Port>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };
    }

    public Task<Port?> GetByIdAsync(int id) => _repository.GetByIdAsync(id);

    public async Task<Port> CreateAsync(Port entity)
    {
        await ValidateAsync(entity);
        return await _repository.AddAsync(entity);
    }

    public async Task<Port?> UpdateAsync(int id, Port entity)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return null;
        }

        await ValidateAsync(entity, id);
        existing.Name = entity.Name;
        existing.Code = entity.Code;
        existing.Country = entity.Country;
        existing.City = entity.City;
        existing.Capacity = entity.Capacity;
        return await _repository.UpdateAsync(existing);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return false;
        }

        await _repository.DeleteAsync(existing);
        return true;
    }

    private async Task ValidateAsync(Port entity, int? excludePortId = null)
    {
        if (string.IsNullOrWhiteSpace(entity.Name))
        {
            throw new ArgumentException("Liman adı zorunludur.");
        }

        if (entity.Capacity < 0)
        {
            throw new ArgumentException("Kapasite negatif olamaz.");
        }

        if (!string.IsNullOrWhiteSpace(entity.Code))
        {
            var exists = await _repository.Query()
                .AnyAsync(p => p.Code == entity.Code && (!excludePortId.HasValue || p.Id != excludePortId.Value));
            
            if (exists)
            {
                throw new ArgumentException("Bu liman koduna sahip başka bir liman zaten mevcut.");
            }
        }
    }
}
