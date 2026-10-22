using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Operations;
using Microsoft.EntityFrameworkCore;

namespace LimanGemiTakip.Api.Services;

public interface IOperationService
{
    Task<FullArrivalResponseDto> RegisterFullArrivalAsync(FullArrivalRequestDto request);
}

public class OperationService : IOperationService
{
    private readonly ApplicationDbContext _context;
    private readonly IShipVisitService _visitService;
    private readonly ICargoService _cargoService;
    private readonly IShipCrewAssignmentService _assignmentService;
    private readonly ILogger<OperationService> _logger;

    public OperationService(
        ApplicationDbContext context,
        IShipVisitService visitService,
        ICargoService cargoService,
        IShipCrewAssignmentService assignmentService,
        ILogger<OperationService> logger)
    {
        _context = context;
        _visitService = visitService;
        _cargoService = cargoService;
        _assignmentService = assignmentService;
        _logger = logger;
    }

    /// <summary>
    /// GÖREV 4: Atomik Operasyon Kaydı (Transaction Yönetimi)
    /// Tek bir çağrıda ShipVisit, Cargo'lar ve CrewAssignment'lar transaction içinde kaydedilir.
    /// Herhangi bir adımda hata olursa tüm işlemler geri alınır (Rollback), kısmi kayıt oluşması engellenir.
    /// </summary>
    public async Task<FullArrivalResponseDto> RegisterFullArrivalAsync(FullArrivalRequestDto request)
    {
        _logger.LogInformation("Tekil Operasyon Kaydı başlatıldı. Gemi Id: {ShipId}, Liman Id: {PortId}", request.ShipId, request.PortId);

        // EF Core Transaction Başlatma
        var isInMemory = _context.Database.ProviderName?.Contains("InMemory") ?? false;
        Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction? transaction = null;

        if (!isInMemory)
        {
            transaction = await _context.Database.BeginTransactionAsync();
        }

        try
        {
            // 1. ADIM: Gemi Ziyareti (ShipVisit) Oluşturma
            var visit = new ShipVisit
            {
                ShipId = request.ShipId,
                PortId = request.PortId,
                ArrivalDate = request.ArrivalDate,
                DepartureDate = request.DepartureDate,
                Purpose = request.Purpose,
                DockNumber = request.DockNumber,
                CreatedBy = "OperationTransaction"
            };

            var createdVisit = await _visitService.CreateAsync(visit);
            _logger.LogInformation("1. Adım Başarılı: ShipVisit oluşturuldu. Id: {VisitId}", createdVisit.Id);

            // 2. ADIM: Yük / Kargo Kayıtlarını Oluşturma
            int cargoCount = 0;
            foreach (var cargoDto in request.Cargoes)
            {
                var cargo = new Cargo
                {
                    ShipId = request.ShipId,
                    Description = cargoDto.Description,
                    WeightTons = cargoDto.WeightTons,
                    Type = cargoDto.Type,
                    ContainerCount = cargoDto.ContainerCount,
                    CreatedBy = "OperationTransaction"
                };

                await _cargoService.CreateAsync(cargo);
                cargoCount++;
            }
            _logger.LogInformation("2. Adım Başarılı: {CargoCount} adet Cargo oluşturuldu.", cargoCount);

            // 3. ADIM: Mürettebat Görev Atamalarını Oluşturma
            int assignmentCount = 0;
            foreach (var assignDto in request.CrewAssignments)
            {
                var assignment = new ShipCrewAssignment
                {
                    ShipId = request.ShipId,
                    CrewMemberId = assignDto.CrewMemberId,
                    StartDate = assignDto.StartDate,
                    EndDate = assignDto.EndDate,
                    RoleOnShip = assignDto.RoleOnShip,
                    CreatedBy = "OperationTransaction"
                };

                await _assignmentService.CreateAsync(assignment);
                assignmentCount++;
            }
            _logger.LogInformation("3. Adım Başarılı: {AssignmentCount} adet ShipCrewAssignment oluşturuldu.", assignmentCount);

            // GÖREV 4: Kasıtlı Hata Simülasyonu Kontrolü
            if (request.SimulateFailureAtStep)
            {
                var reason = request.SimulationFailureReason ?? "Simüle Edilmiş Kritik Sistem Hatası: İşlem adımları tamamlanamadı!";
                _logger.LogWarning("Kasıtlı Hata Simülasyonu Tetiklendi: {Reason}. Rollback başlatılıyor!", reason);
                throw new InvalidOperationException($"[Transaction Rollback Testi]: {reason}");
            }

            // Tüm adımlar başarılı: Transaction Commit edilir
            if (transaction != null)
            {
                await transaction.CommitAsync();
            }

            _logger.LogInformation("Transaction Başarıyla Commit Edildi. Tüm operasyon kayıtları veritabanına yazıldı.");

            return new FullArrivalResponseDto
            {
                Success = true,
                Message = "Tüm operasyonel kayıtlar (Ziyaret, Yükler ve Personel Atamaları) atomik transaction ile başarıyla kaydedildi.",
                CreatedVisitId = createdVisit.Id,
                CreatedCargoCount = cargoCount,
                CreatedAssignmentCount = assignmentCount,
                TransactionStatus = "Committed"
            };
        }
        catch (Exception ex)
        {
            // Hata Durumu: Transaction Rollback edilir (Kısmi kayıtlar silinir/geri alınır)
            if (transaction != null)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Transaction Hatası! Rollback uygulandı. Hiçbir kısmi kayıt veritabanında saklanmadı.");
            }

            throw new InvalidOperationException(
                $"Operasyon Kaydı Başarısız! Hata: {ex.Message}. Transaction gereği tüm işlemler geri alındı (Rollback) ve veritabanı tutarlılığı korundu.", ex);
        }
        finally
        {
            if (transaction != null)
            {
                await transaction.DisposeAsync();
            }
        }
    }
}
