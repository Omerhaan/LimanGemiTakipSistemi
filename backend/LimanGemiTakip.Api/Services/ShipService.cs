using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Common;
using LimanGemiTakip.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Services;

public class ShipService : IShipService
{
    private readonly IRepository<Ship> _repository;
    private readonly IRepository<ShipVisit>? _visitRepository;

    public ShipService(IRepository<Ship> repository, IRepository<ShipVisit>? visitRepository = null)
    {
        _repository = repository;
        _visitRepository = visitRepository;
    }

    public Task<List<Ship>> GetAllAsync()
    {
        return _repository.GetAllAsync();
    }

    public async Task<PagedResult<Ship>> GetPagedAsync(PaginationParams paginationParams)
    {
        var query = _repository.Query();

        if (!string.IsNullOrWhiteSpace(paginationParams.SearchTerm))
        {
            var term = paginationParams.SearchTerm.Trim();
            query = query.Where(s => s.Name.Contains(term) ||
                                     s.ImoNumber.Contains(term) ||
                                     s.Flag.Contains(term) ||
                                     s.Type.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(paginationParams.Type))
        {
            query = query.Where(s => s.Type == paginationParams.Type);
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(s => s.Name)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();

        return new PagedResult<Ship>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };
    }

    public Task<Ship?> GetByIdAsync(int id)
    {
        return _repository.GetByIdAsync(id);
    }

    public async Task<Ship> CreateAsync(Ship entity)
    {
        await ValidateAsync(entity);
        return await _repository.AddAsync(entity);
    }



    public async Task<Ship?> UpdateAsync(int id, Ship entity)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return null;
        }

        entity.Id = id;
        await ValidateAsync(entity);

        existing.Name = entity.Name;
        existing.ImoNumber = entity.ImoNumber;
        existing.Type = entity.Type;
        existing.Flag = entity.Flag;
        existing.BuiltYear = entity.BuiltYear;
        existing.DeadweightTonnage = entity.DeadweightTonnage;

        return await _repository.UpdateAsync(existing);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return false;
        }

        if (_visitRepository != null)
        {
            var hasActiveVisits = await _visitRepository.Query()
                .AnyAsync(v => v.ShipId == id && v.Status != "Cancelled" && v.Status != "Departed");

            if (hasActiveVisits)
            {
                throw new InvalidOperationException(
                    $"'{existing.Name}' gemisine ait aktif veya planlanmış liman ziyaretleri bulunmaktadır. " +
                    "Gemiyi silmeden önce aktif ziyaret kayıtlarını tamamlayınız veya iptal ediniz.");
            }
        }

        await _repository.DeleteAsync(existing);
        return true;
    }

    private async Task ValidateAsync(Ship entity)
    {
        if (string.IsNullOrWhiteSpace(entity.Name))
        {
            throw new ArgumentException("Gemi adı zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(entity.Type))
        {
            throw new ArgumentException("Gemi tipi zorunludur.");
        }

        if (string.IsNullOrWhiteSpace(entity.Flag))
        {
            throw new ArgumentException("Gemi bayrağı / tescil ülkesi zorunludur.");
        }

        if (entity.DeadweightTonnage < 0)
        {
            throw new ArgumentException("Gemi taşıma kapasitesi (DWT) negatif olamaz.");
        }

        if (entity.DeadweightTonnage > 600000m)
        {
            throw new ArgumentException("Gemi taşıma kapasitesi (DWT) gerçekçi sınırlar içinde olmalıdır (Maksimum 600.000 DWT).");
        }

        var maxValidYear = DateTime.UtcNow.Year + 3;
        if (entity.BuiltYear > 0 && (entity.BuiltYear < 1900 || entity.BuiltYear > maxValidYear))
        {
            throw new ArgumentException($"Gemi yapım yılı 1900 ile {maxValidYear} arasında geçerli bir yıl olmalıdır.");
        }

        if (string.IsNullOrWhiteSpace(entity.ImoNumber))
        {
            throw new ArgumentException("IMO numarası zorunludur.");
        }

        // IMO Kontrol Basamağı (Check-Digit) Algoritması Doğrulaması
        var digits = new string(entity.ImoNumber.Where(char.IsDigit).ToArray());
        if (digits.Length != 7)
        {
            throw new ArgumentException("IMO numarası tam olarak 7 basamaklı olmalıdır (örn: 9176187).");
        }

        int sum = 0;
        int[] weights = { 7, 6, 5, 4, 3, 2 };
        for (int i = 0; i < 6; i++)
        {
            sum += (digits[i] - '0') * weights[i];
        }

        int expectedCheckDigit = sum % 10;
        int actualCheckDigit = digits[6] - '0';

        if (expectedCheckDigit != actualCheckDigit)
        {
            throw new ArgumentException($"Geçersiz IMO numarası! Kontrol basamağı algoritmasına göre son basamak {expectedCheckDigit} olmalıdır, ancak {actualCheckDigit} girildi.");
        }

        var normalizedImo = digits;
        var exists = await _repository.ExistsAsync(ship =>
            ship.Id != entity.Id && ship.ImoNumber == normalizedImo);

        if (exists)
        {
            throw new ArgumentException("Bu IMO numarasına sahip başka bir gemi sistemde zaten kayıtlıdır. IMO numarası benzersiz olmalıdır.");
        }

        entity.ImoNumber = normalizedImo;
    }
}
