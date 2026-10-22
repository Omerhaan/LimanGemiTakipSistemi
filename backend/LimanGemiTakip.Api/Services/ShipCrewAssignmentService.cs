using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Common;
using LimanGemiTakip.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Services;

public class ShipCrewAssignmentService : IShipCrewAssignmentService
{
    private readonly IRepository<ShipCrewAssignment> _repository;
    private readonly IRepository<Ship> _shipRepository;
    private readonly IRepository<CrewMember> _crewRepository;

    public ShipCrewAssignmentService(
        IRepository<ShipCrewAssignment> repository,
        IRepository<Ship> shipRepository,
        IRepository<CrewMember> crewRepository)
    {
        _repository = repository;
        _shipRepository = shipRepository;
        _crewRepository = crewRepository;
    }

    public Task<List<ShipCrewAssignment>> GetAllAsync()
    {
        return _repository.Query()
            .Include(assignment => assignment.Ship)
            .Include(assignment => assignment.CrewMember)
            .ToListAsync();
    }

    public async Task<PagedResult<ShipCrewAssignment>> GetPagedAsync(PaginationParams paginationParams)
    {
        var query = _repository.Query()
            .Include(assignment => assignment.Ship)
            .Include(assignment => assignment.CrewMember)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(paginationParams.SearchTerm))
        {
            var term = paginationParams.SearchTerm.Trim();
            query = query.Where(a => (a.Ship != null && a.Ship.Name.Contains(term)) ||
                                     (a.CrewMember != null && (a.CrewMember.FirstName.Contains(term) || a.CrewMember.LastName.Contains(term))) ||
                                     a.RoleOnShip.Contains(term));
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.StartDate)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();

        return new PagedResult<ShipCrewAssignment>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };
    }

    public Task<ShipCrewAssignment?> GetByIdAsync(int id)
    {
        return _repository.Query()
            .Include(assignment => assignment.Ship)
            .Include(assignment => assignment.CrewMember)
            .FirstOrDefaultAsync(assignment => assignment.Id == id);
    }

    public async Task<ShipCrewAssignment> CreateAsync(ShipCrewAssignment entity)
    {
        await ValidateAsync(entity);
        return await _repository.AddAsync(entity);
    }

    public async Task<ShipCrewAssignment?> UpdateAsync(int id, ShipCrewAssignment entity)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return null;
        }

        entity.Id = id;
        await ValidateAsync(entity);

        existing.ShipId = entity.ShipId;
        existing.CrewMemberId = entity.CrewMemberId;
        existing.StartDate = entity.StartDate;
        existing.EndDate = entity.EndDate;
        existing.RoleOnShip = entity.RoleOnShip;
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

    private async Task ValidateAsync(ShipCrewAssignment entity)
    {
        // 1. Tarih Mantık Kontrolü
        if (entity.EndDate.HasValue && entity.EndDate.Value.Date < entity.StartDate.Date)
        {
            throw new ArgumentException("Görev bitiş tarihi, başlangıç tarihinden önce olamaz.");
        }

        var newStart = entity.StartDate.Date;
        var newEnd = entity.EndDate?.Date;

        // 2. Kural: Bir çalışan aynı anda sadece 1 gemiye atanabilir!
        // İlgili personelin mevcut diğer tüm atamalarını inceleyelim.
        var existingAssignments = await _repository.Query()
            .Include(a => a.Ship)
            .Include(a => a.CrewMember)
            .Where(a => a.CrewMemberId == entity.CrewMemberId && a.Id != entity.Id)
            .ToListAsync();

        foreach (var existing in existingAssignments)
        {
            var exStart = existing.StartDate.Date;
            var exEnd = existing.EndDate?.Date;

            // Tarih aralıklarının çakışma kontrolü:
            // İki aralık [Start1, End1] ve [Start2, End2] çakışır <=> Start1 <= End2 && Start2 <= End1
            // (End değeri null ise görev ucu açık/devam ediyor demektir, yani sonsuza kadar uzanır)
            bool overlaps = (newEnd == null || newEnd.Value >= exStart) &&
                            (exEnd == null || exEnd.Value >= newStart);

            if (overlaps)
            {
                var crewName = existing.CrewMember?.FullName;
                if (string.IsNullOrWhiteSpace(crewName))
                {
                    var cm = await _crewRepository.GetByIdAsync(entity.CrewMemberId);
                    crewName = cm != null
                        ? (!string.IsNullOrWhiteSpace(cm.FullName) ? cm.FullName : $"{cm.FirstName} {cm.LastName}".Trim())
                        : $"Personel #{entity.CrewMemberId}";
                }

                var exEndStr = existing.EndDate.HasValue
                    ? existing.EndDate.Value.ToString("dd.MM.yyyy")
                    : "Devam Ediyor";

                if (existing.ShipId != entity.ShipId)
                {
                    var otherShipName = existing.Ship?.Name;
                    if (string.IsNullOrWhiteSpace(otherShipName))
                    {
                        var s = await _shipRepository.GetByIdAsync(existing.ShipId);
                        otherShipName = s?.Name ?? $"Gemi #{existing.ShipId}";
                    }

                    throw new InvalidOperationException(
                        $"Çift Gemi Ataması Engeli: '{crewName}' adlı personel {exStart:dd.MM.yyyy} - {exEndStr} tarihleri arasında " +
                        $"zaten '{otherShipName}' gemisinde görev yapmaktadır! Bir personel aynı anda birden fazla gemide görev alamaz.");
                }
                else
                {
                    var shipName = existing.Ship?.Name;
                    if (string.IsNullOrWhiteSpace(shipName))
                    {
                        var s = await _shipRepository.GetByIdAsync(entity.ShipId);
                        shipName = s?.Name ?? $"Gemi #{entity.ShipId}";
                    }

                    throw new InvalidOperationException(
                        $"Mükerrer Görev Engeli: '{crewName}' adlı personelin '{shipName}' gemisinde {exStart:dd.MM.yyyy} - {exEndStr} " +
                        $"tarihleri arasında zaten aktif bir görevi bulunmaktadır! Çakışan tarihlerde mükerrer görev atanamaz.");
                }
            }
        }
    }
}
