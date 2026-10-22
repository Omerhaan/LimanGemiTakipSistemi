using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Common;
using LimanGemiTakip.Api.Models.Operations;
using LimanGemiTakip.Api.Repositories;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Services;

public class ShipVisitService : IShipVisitService
{
    private readonly IRepository<ShipVisit> _repository;
    private readonly IRepository<Port> _portRepository;
    private readonly IRepository<Ship> _shipRepository;
    private readonly IRepository<CrewMember>? _crewRepository;
    private readonly IRepository<ShipCrewAssignment>? _assignmentRepository;

    public ShipVisitService(
        IRepository<ShipVisit> repository,
        IRepository<Port> portRepository,
        IRepository<Ship> shipRepository)
        : this(repository, portRepository, shipRepository, null, null)
    {
    }

    public ShipVisitService(
        IRepository<ShipVisit> repository,
        IRepository<Port> portRepository,
        IRepository<Ship> shipRepository,
        IRepository<CrewMember>? crewRepository,
        IRepository<ShipCrewAssignment>? assignmentRepository)
    {
        _repository = repository;
        _portRepository = portRepository;
        _shipRepository = shipRepository;
        _crewRepository = crewRepository;
        _assignmentRepository = assignmentRepository;
    }

    public async Task<List<ShipVisit>> GetAllAsync()
    {
        var visits = await _repository.Query()
            .Include(visit => visit.Ship)
            .Include(visit => visit.Port)
            .Include(visit => visit.OriginPort)
            .ToListAsync();

        foreach (var visit in visits)
        {
            ApplyDynamicStatus(visit);
        }

        return visits;
    }

    public async Task<PagedResult<ShipVisit>> GetPagedAsync(PaginationParams paginationParams)
    {
        var query = _repository.Query()
            .Include(v => v.Ship)
            .Include(v => v.Port)
            .Include(v => v.OriginPort)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(paginationParams.SearchTerm))
        {
            var term = paginationParams.SearchTerm.Trim();
            query = query.Where(v => (v.Ship != null && v.Ship.Name.Contains(term)) ||
                                     (v.Port != null && v.Port.Name.Contains(term)) ||
                                     (v.OriginPort != null && v.OriginPort.Name.Contains(term)) ||
                                     (v.DockNumber != null && v.DockNumber.Contains(term)) ||
                                     v.Purpose.Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(paginationParams.Status) && !string.Equals(paginationParams.Status, "ALL", StringComparison.OrdinalIgnoreCase))
        {
            var requestedStatus = paginationParams.Status.Trim();
            var now = DateTime.UtcNow;

            if (string.Equals(requestedStatus, "Cancelled", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(v => v.Status == "Cancelled");
            }
            else if (string.Equals(requestedStatus, "Departed", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(v => v.Status != "Cancelled" && now > v.DepartureDate);
            }
            else if (string.Equals(requestedStatus, "Docked", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(v => v.Status != "Cancelled" && now >= v.ArrivalDate && now <= v.DepartureDate);
            }
            else if (string.Equals(requestedStatus, "Scheduled", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(v => v.Status != "Cancelled" && now < v.ArrivalDate);
            }
            else
            {
                query = query.Where(v => v.Status == requestedStatus);
            }
        }

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(v => v.ArrivalDate)
            .Skip((paginationParams.PageNumber - 1) * paginationParams.PageSize)
            .Take(paginationParams.PageSize)
            .ToListAsync();

        foreach (var visit in items)
        {
            ApplyDynamicStatus(visit);
        }

        return new PagedResult<ShipVisit>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = paginationParams.PageNumber,
            PageSize = paginationParams.PageSize
        };
    }

    public async Task<ShipVisit?> GetByIdAsync(int id)
    {
        var visit = await _repository.Query()
            .Include(visit => visit.Ship)
            .Include(visit => visit.Port)
            .Include(visit => visit.OriginPort)
            .FirstOrDefaultAsync(visit => visit.Id == id);

        if (visit != null)
        {
            ApplyDynamicStatus(visit);
        }

        return visit;
    }

    public async Task<ShipVisit> CreateAsync(ShipVisit entity)
    {
        await ValidateAsync(entity);
        ApplyDynamicStatus(entity);
        return await _repository.AddAsync(entity);
    }

    public async Task<ShipVisit?> UpdateAsync(int id, ShipVisit entity)
    {
        var existing = await _repository.GetByIdAsync(id);
        if (existing is null)
        {
            return null;
        }

        await ValidateAsync(entity, id);
        ApplyDynamicStatus(entity);

        existing.ShipId = entity.ShipId;
        existing.OriginPortId = entity.OriginPortId;
        existing.PortId = entity.PortId;
        existing.ArrivalDate = entity.ArrivalDate;
        existing.DepartureDate = entity.DepartureDate;
        existing.Purpose = entity.Purpose;
        existing.Status = entity.Status;
        existing.DockNumber = entity.DockNumber;

        // Görev 5: Optimistic Concurrency Kontrolü
        if (entity.RowVersion != null && existing.RowVersion != null && !entity.RowVersion.SequenceEqual(existing.RowVersion))
        {
            throw new DbUpdateConcurrencyException("Eş zamanlı güncelleme çakışması (Concurrency Token mismatch).");
        }

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

    private async Task ValidateAsync(ShipVisit entity, int? excludeVisitId = null)
    {
        if (entity.ArrivalDate >= entity.DepartureDate)
        {
            throw new ArgumentException("Geliş tarihi ayrılış tarihinden önce olmalıdır.");
        }

        if (entity.OriginPortId.HasValue && entity.OriginPortId.Value == entity.PortId)
        {
            throw new ArgumentException("Kalkış limanı ile varış limanı aynı olamaz.");
        }

        // İptal edilmiş bir ziyaret için kısıt kontrolü gerekmez
        if (string.Equals(entity.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        // 1. KURAL: Gemi Çift Rezervasyon (Işınlanma) Engeli
        // Bir gemi aynı anda iki farklı limanda/seferde bulunamaz!
        var conflictingShipVisit = await _repository.Query()
            .Include(v => v.Port)
            .Where(v => v.ShipId == entity.ShipId &&
                        (!excludeVisitId.HasValue || v.Id != excludeVisitId.Value) &&
                        v.Status != "Cancelled" &&
                        entity.ArrivalDate < v.DepartureDate &&
                        entity.DepartureDate > v.ArrivalDate)
            .FirstOrDefaultAsync();

        if (conflictingShipVisit != null)
        {
            var ship = await _shipRepository.GetByIdAsync(entity.ShipId);
            var shipName = ship?.Name ?? $"Gemi #{entity.ShipId}";
            var portName = conflictingShipVisit.Port?.Name ?? $"Liman #{conflictingShipVisit.PortId}";

            throw new InvalidOperationException(
                $"Gemi Çift Rezervasyon (Işınlanma) Engeli: '{shipName}' gemisi belirtilen tarih aralığında " +
                $"({entity.ArrivalDate:dd.MM.yyyy HH:mm} - {entity.DepartureDate:dd.MM.yyyy HH:mm}) zaten '{portName}' limanında " +
                $"aktif bir sefere/ziyarete ({conflictingShipVisit.ArrivalDate:dd.MM.yyyy HH:mm} - {conflictingShipVisit.DepartureDate:dd.MM.yyyy HH:mm}) sahiptir. " +
                $"Bir gemi aynı anda iki farklı yerde bulunamaz!");
        }

        // 2. KURAL: Liman Eşzamanlı Kapasite Aşımı Kontrolü
        // Aynı tarih aralığında bir limanda rıhtımda olan gemi sayısı o limanın kapasitesine ulaştıysa yeni gemi yanaşamaz.
        var port = await _portRepository.GetByIdAsync(entity.PortId);
        if (port != null && port.Capacity > 0)
        {
            var overlappingVisitsCount = await _repository.Query()
                .Where(v => v.PortId == entity.PortId &&
                            (!excludeVisitId.HasValue || v.Id != excludeVisitId.Value) &&
                            v.Status != "Cancelled" &&
                            entity.ArrivalDate < v.DepartureDate &&
                            entity.DepartureDate > v.ArrivalDate)
                .CountAsync();

            if (overlappingVisitsCount >= port.Capacity)
            {
                throw new InvalidOperationException(
                    $"Liman Rıhtım Kapasitesi Dolu! '{port.Name}' limanının azami eşzamanlı gemi yanaşma kapasitesi {port.Capacity} adettir. " +
                    $"Belirtilen tarih aralığında ({entity.ArrivalDate:dd.MM.yyyy HH:mm} - {entity.DepartureDate:dd.MM.yyyy HH:mm}) " +
                    $"limanda zaten {overlappingVisitsCount} adet gemi rıhtım/ziyaret rezervasyonuna sahiptir. Yeni gemi kabul edilemez.");
            }
        }
    }

    public async Task<List<AvailableShipDto>> GetAvailableShipsAsync(DateTime departureDate, DateTime arrivalDate)
    {
        var allShips = await _shipRepository.GetAllAsync();
        var activeVisits = await _repository.Query()
            .Include(v => v.Port)
            .Where(v => v.Status != "Cancelled" &&
                        departureDate < v.DepartureDate &&
                        arrivalDate > v.ArrivalDate)
            .ToListAsync();

        var result = new List<AvailableShipDto>();
        foreach (var ship in allShips)
        {
            var conflict = activeVisits.FirstOrDefault(v => v.ShipId == ship.Id);
            var lastVisit = await _repository.Query()
                .Include(v => v.Port)
                .Where(v => v.ShipId == ship.Id && v.Status != "Cancelled" && v.ArrivalDate <= departureDate)
                .OrderByDescending(v => v.DepartureDate)
                .FirstOrDefaultAsync();

            result.Add(new AvailableShipDto
            {
                ShipId = ship.Id,
                Name = ship.Name,
                ImoNumber = ship.ImoNumber,
                Flag = ship.Flag,
                Type = ship.Type,
                DeadweightTonnage = ship.DeadweightTonnage,
                IsAvailable = conflict == null,
                CurrentStatus = conflict != null 
                    ? $"{conflict.Port?.Name ?? "Liman"} aktif seferinde ({conflict.ArrivalDate:dd.MM} - {conflict.DepartureDate:dd.MM})"
                    : "Müsait (Boşta)",
                LastKnownPortName = conflict?.Port?.Name ?? lastVisit?.Port?.Name ?? "Açık Deniz"
            });
        }

        return result.OrderByDescending(s => s.IsAvailable).ThenBy(s => s.Name).ToList();
    }

    public async Task<List<AvailableCrewDto>> GetAvailableCrewAsync(DateTime departureDate, DateTime arrivalDate, string? role = null)
    {
        if (_crewRepository == null || _assignmentRepository == null)
        {
            return new List<AvailableCrewDto>();
        }

        var crewQuery = _crewRepository.Query().AsQueryable();
        if (!string.IsNullOrWhiteSpace(role))
        {
            var r = role.Trim();
            crewQuery = crewQuery.Where(c => c.Role.Contains(r));
        }

        var allCrew = await crewQuery.ToListAsync();
        var activeAssignments = await _assignmentRepository.Query()
            .Include(a => a.Ship)
            .Where(a => a.StartDate < arrivalDate &&
                        (a.EndDate == null || a.EndDate > departureDate))
            .ToListAsync();

        var result = new List<AvailableCrewDto>();
        foreach (var crew in allCrew)
        {
            var conflict = activeAssignments.FirstOrDefault(a => a.CrewMemberId == crew.Id);
            result.Add(new AvailableCrewDto
            {
                CrewId = crew.Id,
                FullName = crew.FullName ?? $"{crew.FirstName} {crew.LastName}".Trim(),
                Role = crew.Role,
                Nationality = crew.Nationality,
                Email = crew.Email,
                Phone = crew.Phone,
                IsAvailable = conflict == null,
                ConflictDescription = conflict != null
                    ? $"{conflict.Ship?.Name ?? "Gemi"} üzerinde görevli ({conflict.RoleOnShip})"
                    : null
            });
        }

        return result.OrderByDescending(c => c.IsAvailable).ThenBy(c => c.FullName).ToList();
    }

    public async Task<SafeManningValidationResult> ValidateSafeManningAsync(int shipId, List<int> crewMemberIds)
    {
        var result = new SafeManningValidationResult
        {
            TotalCrewCount = crewMemberIds?.Count ?? 0
        };

        if (_crewRepository == null || crewMemberIds == null || crewMemberIds.Count == 0)
        {
            result.IsCompliant = false;
            result.Errors.Add("Gemide hiçbir mürettebat seçilmedi. Asgari emniyetli donatım (STCW) şartı karşılanmıyor!");
            return result;
        }

        var members = await _crewRepository.Query()
            .Where(c => crewMemberIds.Contains(c.Id))
            .ToListAsync();

        result.HasMaster = members.Any(m => 
            m.Role.Contains("Kaptan", StringComparison.OrdinalIgnoreCase) ||
            m.Role.Contains("Master", StringComparison.OrdinalIgnoreCase) ||
            m.Role.Contains("Captain", StringComparison.OrdinalIgnoreCase));

        result.HasChiefEngineer = members.Any(m => 
            m.Role.Contains("Mühendis", StringComparison.OrdinalIgnoreCase) ||
            m.Role.Contains("Çarkçı", StringComparison.OrdinalIgnoreCase) ||
            m.Role.Contains("Engineer", StringComparison.OrdinalIgnoreCase));

        if (!result.HasMaster)
        {
            result.Errors.Add("Eksik Kilit Personel: Gemide atanmış Kaptan (Master) bulunmuyor!");
        }

        if (!result.HasChiefEngineer)
        {
            result.Warnings.Add("Eksik Teknik Personel: Gemide Başmühendis / Çarkçıbaşı (Chief Engineer) seçilmedi.");
        }

        if (result.TotalCrewCount < 3)
        {
            result.Warnings.Add($"Asgari Donatım Tavsiyesi: Toplam {result.TotalCrewCount} personel seçildi. Uluslararası standartlarda emniyetli seyir için asgari 3 personel önerilir.");
        }

        result.IsCompliant = result.HasMaster;
        return result;
    }

    public async Task<DispatchVoyageResponse> DispatchVoyageAsync(DispatchVoyageRequest request)
    {
        if (request.DepartureDate >= request.ArrivalDate)
        {
            return new DispatchVoyageResponse
            {
                Success = false,
                Message = "Varış tarihi kalkış tarihinden sonra olmalıdır."
            };
        }

        if (request.OriginPortId == request.DestinationPortId)
        {
            return new DispatchVoyageResponse
            {
                Success = false,
                Message = "Kalkış limanı ile varış limanı aynı olamaz."
            };
        }

        // 1. Gemi Müsaitlik Kontrolü
        var availableShips = await GetAvailableShipsAsync(request.DepartureDate, request.ArrivalDate);
        var targetShip = availableShips.FirstOrDefault(s => s.ShipId == request.ShipId);
        if (targetShip != null && !targetShip.IsAvailable)
        {
            return new DispatchVoyageResponse
            {
                Success = false,
                Message = $"Gemi bu tarih aralığında müsait değil: {targetShip.CurrentStatus}"
            };
        }

        // 2. Mürettebat Güvenli Donatım Kontrolü
        var manningStatus = await ValidateSafeManningAsync(request.ShipId, request.CrewMemberIds);
        if (!manningStatus.IsCompliant)
        {
            return new DispatchVoyageResponse
            {
                Success = false,
                Message = string.Join(" ", manningStatus.Errors),
                ManningStatus = manningStatus
            };
        }

        // 3. Seferi Oluştur
        var visit = new ShipVisit
        {
            ShipId = request.ShipId,
            OriginPortId = request.OriginPortId,
            PortId = request.DestinationPortId,
            ArrivalDate = request.DepartureDate,
            DepartureDate = request.ArrivalDate,
            Purpose = string.IsNullOrWhiteSpace(request.Purpose) ? "Ticari Sefer" : request.Purpose,
            DockNumber = request.DockNumber,
            Status = "Scheduled"
        };

        var createdVisit = await CreateAsync(visit);

        // 4. Mürettebat Atamalarını Yap
        if (_assignmentRepository != null && _crewRepository != null && request.CrewMemberIds.Count > 0)
        {
            var crewList = await _crewRepository.Query()
                .Where(c => request.CrewMemberIds.Contains(c.Id))
                .ToListAsync();

            foreach (var crew in crewList)
            {
                var assignment = new ShipCrewAssignment
                {
                    ShipId = request.ShipId,
                    CrewMemberId = crew.Id,
                    StartDate = request.DepartureDate,
                    EndDate = request.ArrivalDate,
                    RoleOnShip = crew.Role
                };
                await _assignmentRepository.AddAsync(assignment);
            }
        }

        return new DispatchVoyageResponse
        {
            Success = true,
            Message = "Sefer başarıyla planlandı ve mürettebat atamaları tamamlandı.",
            Visit = createdVisit,
            ManningStatus = manningStatus
        };
    }

    private static void ApplyDynamicStatus(ShipVisit visit)
    {
        // İptal edilmiş kayıtlar kullanıcının manuel tercihidir, dokunmuyoruz
        if (string.Equals(visit.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var now = DateTime.UtcNow;
        if (now > visit.DepartureDate)
        {
            visit.Status = "Departed";
        }
        else if (now >= visit.ArrivalDate && now <= visit.DepartureDate)
        {
            visit.Status = "Docked";
        }
        else
        {
            visit.Status = "Scheduled";
        }
    }
}
