using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Common;
using LimanGemiTakip.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Services;

public class CargoService : ICargoService
{
    private readonly IRepository<Cargo> _repository;
    private readonly IRepository<Ship> _shipRepository;

    public CargoService(IRepository<Cargo> repository, IRepository<Ship> shipRepository)
    {
        _repository = repository;
        _shipRepository = shipRepository;
    }

    public Task<List<Cargo>> GetAllAsync()
    {
        return _repository.Query()
            .Include(cargo => cargo.Ship)
            .ToListAsync();
    }

    public async Task<PagedResult<Cargo>> GetPagedAsync(PaginationParams paginationParams)
    {
        var query = _repository.Query()
            .Include(c => c.Ship)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(paginationParams.SearchTerm))
        {
            var term = paginationParams.SearchTerm.Trim();
            query = query.Where(c => c.Description.Contains(term) ||
                                     c.Type.Contains(term) ||
                                     (c.BillOfLadingNumber != null && c.BillOfLadingNumber.Contains(term)) ||
                                     (c.Shipper != null && c.Shipper.Contains(term)) ||
                                     (c.Consignee != null && c.Consignee.Contains(term)) ||
                                     (c.Ship != null && c.Ship.Name.Contains(term)));
        }

        if (!string.IsNullOrWhiteSpace(paginationParams.Type))
        {
            query = query.Where(c => c.Type == paginationParams.Type);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(c => c.Id)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();

        return new PagedResult<Cargo>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };
    }

    public Task<Cargo?> GetByIdAsync(int id)
    {
        return _repository.Query()
            .Include(cargo => cargo.Ship)
            .FirstOrDefaultAsync(cargo => cargo.Id == id);
    }

    public async Task<Cargo> CreateAsync(Cargo entity)
    {
        await ValidateAsync(entity);
        return await _repository.AddAsync(entity);
    }

    public async Task<Cargo?> UpdateAsync(int id, Cargo entity)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return null;
        }

        await ValidateAsync(entity, id);
        existing.ShipId = entity.ShipId;
        existing.Description = entity.Description;
        existing.WeightTons = entity.WeightTons;
        existing.Type = entity.Type;
        existing.ContainerCount = entity.ContainerCount;
        existing.BillOfLadingNumber = entity.BillOfLadingNumber;
        existing.ImdgClass = entity.ImdgClass;
        existing.Shipper = entity.Shipper;
        existing.Consignee = entity.Consignee;
        existing.SealNumber = entity.SealNumber;
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

    private async Task ValidateAsync(Cargo entity, int? excludeCargoId = null)
    {
        if (entity.WeightTons <= 0)
        {
            throw new ArgumentException("Yük ağırlığı 0'dan büyük olmalıdır.");
        }

        if (string.IsNullOrWhiteSpace(entity.Description))
        {
            throw new ArgumentException("Yük açıklaması zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(entity.Type))
        {
            throw new ArgumentException("Kargo türü zorunludur.");
        }

        // Gemi DWT Kapasite Aşımı Kontrolü (Overweight / Sinking Prevention)
        var ship = await _shipRepository.GetByIdAsync(entity.ShipId);
        if (ship != null && ship.DeadweightTonnage > 0)
        {
            var otherCargoesWeight = await _repository.Query()
                .Where(c => c.ShipId == entity.ShipId && (!excludeCargoId.HasValue || c.Id != excludeCargoId.Value))
                .SumAsync(c => c.WeightTons);

            var totalWeight = otherCargoesWeight + entity.WeightTons;

            if (totalWeight > ship.DeadweightTonnage)
            {
                var remainingCapacity = Math.Max(0, ship.DeadweightTonnage - otherCargoesWeight);
                throw new ArgumentException(
                    $"Kapasite Aşımı Güvenlik Uyarısı: '{ship.Name}' gemisinin azami DWT taşıma kapasitesi {ship.DeadweightTonnage:N0} Ton'dur! " +
                    $"Mevcut yüklü miktar: {otherCargoesWeight:N0} Ton. Kalan taşınabilir kapasite: {remainingCapacity:N0} Ton. " +
                    $"Yüklenmek istenen miktar ({entity.WeightTons:N0} Ton) gemi kapasitesini {totalWeight - ship.DeadweightTonnage:N0} Ton aşmaktadır.");
            }
        }
    }
}
