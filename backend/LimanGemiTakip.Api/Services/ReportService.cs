using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models.Reports;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;

namespace LimanGemiTakip.Api.Services;

public interface IReportService
{
    Task<OperationReportResponseDto> GetOperationsSlowAsync(int pageNumber = 1, int pageSize = 50);
    Task<OperationReportResponseDto> GetOperationsOptimizedAsync(int pageNumber = 1, int pageSize = 50);
    Task<PerformanceComparisonResultDto> GetPerformanceComparisonAsync(int sampleSize = 50);
    Task<DashboardChartsDto> GetDashboardChartsAsync();
}

public class ReportService : IReportService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReportService> _logger;

    public ReportService(ApplicationDbContext context, ILogger<ReportService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// GÖREV 2: N+1 Query Probleminin Kasıtlı Modellenmesi
    /// Her ziyaret için ilişkili gemi, liman, yük ve personel verileri döngü içinde AYRI AYRI veritabanına sorulur.
    /// Sonuç: 1 + (4 * N) adet SQL sorgusu çalışır!
    /// </summary>
    public async Task<OperationReportResponseDto> GetOperationsSlowAsync(int pageNumber = 1, int pageSize = 50)
    {
        var sw = Stopwatch.StartNew();
        int queryCount = 0;

        var totalVisits = await _context.ShipVisits.CountAsync();
        queryCount++;

        // 1. Ana sorgu: Sadece ziyaretler çekilir (İlişkili tablolar dahil EDİLMEZ)
        var visits = await _context.ShipVisits
            .OrderByDescending(v => v.ArrivalDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        queryCount++;

        var reportItems = new List<OperationReportItemDto>();

        // 2. KASITLI N+1 PROBLEMİ: Her bir kayıt için döngüde ayrı SQL sorguları atılır
        foreach (var visit in visits)
        {
            // Sorgu 1 (N defa): Gemi sorgusu
            var ship = await _context.Ships.FindAsync(visit.ShipId);
            queryCount++;

            // Sorgu 2 (N defa): Liman sorgusu
            var port = await _context.Ports.FindAsync(visit.PortId);
            queryCount++;

            // Sorgu 3 (N defa): Kargo yükleri sorgusu (tüm liste belleğe çekilir)
            var cargoes = await _context.Cargoes
                .Where(c => c.ShipId == visit.ShipId)
                .ToListAsync();
            queryCount++;

            // Sorgu 4 (N defa): Personel atamaları sorgusu (tüm liste belleğe çekilir)
            var crewAssignments = await _context.ShipCrewAssignments
                .Where(a => a.ShipId == visit.ShipId)
                .ToListAsync();
            queryCount++;

            reportItems.Add(new OperationReportItemDto
            {
                VisitId = visit.Id,
                ShipName = ship?.Name ?? $"Gemi #{visit.ShipId}",
                PortName = port?.Name ?? $"Liman #{visit.PortId}",
                ArrivalDate = visit.ArrivalDate,
                DepartureDate = visit.DepartureDate,
                Status = visit.Status,
                CargoCount = cargoes.Count,
                TotalCargoWeightTons = cargoes.Sum(c => c.WeightTons),
                CrewCount = crewAssignments.Count
            });
        }

        sw.Stop();
        _logger.LogWarning("N+1 Raporu tamamlandı. Kayıt Sayısı: {Count}, Toplam SQL Sorgu: {Queries}, Süre: {Time} ms",
            reportItems.Count, queryCount, sw.Elapsed.TotalMilliseconds);

        return new OperationReportResponseDto
        {
            Items = reportItems,
            TotalCount = totalVisits,
            PageNumber = pageNumber,
            PageSize = pageSize,
            QueryCount = queryCount,
            ExecutionTimeMs = Math.Round(sw.Elapsed.TotalMilliseconds, 2),
            Approach = "Inefficient N+1 (Her kayıt için 4 ayrı SQL sorgusu)"
        };
    }

    /// <summary>
    /// GÖREV 3: Performans İyileştirmesi (Tek SQL Sorgusu & Projeksiyon & AsNoTracking & Paging)
    /// Include yerine DTO Projeksiyonu (.Select) kullanılarak ilişkili tabloların aggregate değerleri
    /// SQL Server tarafında tek bir SELECT sorgusunda hesaplanır ve ChangeTracker yükü kaldırılır.
    /// Sonuç: Sadece 1 (veya toplam sayı ile 2) SQL sorgusu çalışır!
    /// </summary>
    public async Task<OperationReportResponseDto> GetOperationsOptimizedAsync(int pageNumber = 1, int pageSize = 50)
    {
        var sw = Stopwatch.StartNew();
        int queryCount = 0;

        var totalVisits = await _context.ShipVisits.CountAsync();
        queryCount++;

        // TEK SORGU OPTİMİZASYONU:
        // 1. AsNoTracking() -> Entity takibi yapılmaz, CPU & Bellek tasarrufu
        // 2. Projeksiyon (.Select) -> Yalnızca gerekli alanlar SQL'den çekilir
        // 3. Subquery Aggregation -> Count ve Sum hesapları SQL Server içinde yapılır
        // 4. Paging (.Skip / .Take) -> Yalnızca istenen sayfa SQL'den gelir
        var reportItems = await _context.ShipVisits
            .AsNoTracking()
            .OrderByDescending(v => v.ArrivalDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(v => new OperationReportItemDto
            {
                VisitId = v.Id,
                ShipName = v.Ship != null ? v.Ship.Name : "Bilinmiyor",
                PortName = v.Port != null ? v.Port.Name : "Bilinmiyor",
                ArrivalDate = v.ArrivalDate,
                DepartureDate = v.DepartureDate,
                Status = v.Status,
                CargoCount = _context.Cargoes.Count(c => c.ShipId == v.ShipId),
                TotalCargoWeightTons = _context.Cargoes.Where(c => c.ShipId == v.ShipId).Sum(c => c.WeightTons),
                CrewCount = _context.ShipCrewAssignments.Count(a => a.ShipId == v.ShipId)
            })
            .ToListAsync();
        queryCount++;

        sw.Stop();
        _logger.LogInformation("Optimize Rapor tamamlandı. Kayıt Sayısı: {Count}, Toplam SQL Sorgu: {Queries}, Süre: {Time} ms",
            reportItems.Count, queryCount, sw.Elapsed.TotalMilliseconds);

        return new OperationReportResponseDto
        {
            Items = reportItems,
            TotalCount = totalVisits,
            PageNumber = pageNumber,
            PageSize = pageSize,
            QueryCount = queryCount,
            ExecutionTimeMs = Math.Round(sw.Elapsed.TotalMilliseconds, 2),
            Approach = "Optimized (AsNoTracking + DTO Projection + Subquery Aggregation)"
        };
    }

    /// <summary>
    /// GÖREV 3: Karşılaştırmalı Performans Analizi
    /// </summary>
    public async Task<PerformanceComparisonResultDto> GetPerformanceComparisonAsync(int sampleSize = 50)
    {
        var slowResult = await GetOperationsSlowAsync(1, sampleSize);
        var fastResult = await GetOperationsOptimizedAsync(1, sampleSize);

        double speedup = fastResult.ExecutionTimeMs > 0
            ? Math.Round(slowResult.ExecutionTimeMs / fastResult.ExecutionTimeMs, 1)
            : 1.0;

        double queryReduction = slowResult.QueryCount > 0
            ? Math.Round(((double)(slowResult.QueryCount - fastResult.QueryCount) / slowResult.QueryCount) * 100, 1)
            : 0;

        return new PerformanceComparisonResultDto
        {
            TotalRecordsAnalyzed = sampleSize,
            InefficientNPlusOne = new ApproachMetric
            {
                SqlQueryCount = slowResult.QueryCount,
                ExecutionTimeMs = slowResult.ExecutionTimeMs,
                MemoryUsage = "Aktif (ChangeTracker)",
                Description = "Döngü içi ilişkisel yükleme (N+1)"
            },
            OptimizedSingleQuery = new ApproachMetric
            {
                SqlQueryCount = fastResult.QueryCount,
                ExecutionTimeMs = fastResult.ExecutionTimeMs,
                MemoryUsage = "Devre Dışı (AsNoTracking)",
                Description = "Tekil SQL projeksiyonu ve alt sorgu toplamları"
            },
            SpeedupFactor = speedup,
            QueryReductionPercentage = queryReduction,
            AnalysisSummary = $"SQL sorgu sayısı %{queryReduction} azaltıldı, yürütme süresi {speedup}x hızlandı."
        };
    }

    /// <summary>
    /// Dashboard grafikleri için aggregate veri sorguları
    /// </summary>
    public async Task<DashboardChartsDto> GetDashboardChartsAsync()
    {
        var result = new DashboardChartsDto();

        // Gemi tipi dağılımı
        result.ShipTypeDistribution = await _context.Ships
            .AsNoTracking()
            .GroupBy(s => s.Type)
            .Select(g => new ShipTypeDistributionItem
            {
                Type = g.Key,
                Count = g.Count()
            })
            .OrderByDescending(x => x.Count)
            .ToListAsync();

        // Son 6 aylık sefer trendi
        var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
        var visitsByMonth = await _context.ShipVisits
            .AsNoTracking()
            .Where(v => v.ArrivalDate >= sixMonthsAgo)
            .ToListAsync();

        result.MonthlyVisits = visitsByMonth
            .GroupBy(v => v.ArrivalDate.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new MonthlyVisitItem
            {
                Month = g.Key,
                Scheduled = g.Count(v => v.Status == "Scheduled"),
                Docked = g.Count(v => v.Status == "Docked"),
                Departed = g.Count(v => v.Status == "Departed"),
                Cancelled = g.Count(v => v.Status == "Cancelled")
            })
            .ToList();

        // Kargo tipi dağılımı
        result.CargoTypeBreakdown = await _context.Cargoes
            .AsNoTracking()
            .GroupBy(c => c.Type)
            .Select(g => new CargoTypeBreakdownItem
            {
                Type = g.Key,
                Count = g.Count(),
                TotalWeightTons = g.Sum(c => c.WeightTons)
            })
            .OrderByDescending(x => x.TotalWeightTons)
            .ToListAsync();

        // Liman doluluk oranları (en yoğun 10 liman)
        var dockedVisits = await _context.ShipVisits
            .AsNoTracking()
            .Where(v => v.Status == "Docked")
            .GroupBy(v => v.PortId)
            .Select(g => new { PortId = g.Key, DockedCount = g.Count() })
            .ToListAsync();

        var ports = await _context.Ports
            .AsNoTracking()
            .Select(p => new { p.Id, p.Name, p.Capacity })
            .ToListAsync();

        result.TopPortOccupancy = dockedVisits
            .Join(ports, d => d.PortId, p => p.Id, (d, p) => new PortOccupancyItem
            {
                PortName = p.Name,
                DockedCount = d.DockedCount,
                Capacity = p.Capacity > 0 ? p.Capacity : 1,
                OccupancyPercent = Math.Round((double)d.DockedCount / Math.Max(p.Capacity, 1) * 100, 1)
            })
            .OrderByDescending(x => x.OccupancyPercent)
            .Take(10)
            .ToList();

        // Filo özeti
        var totalShips = await _context.Ships.CountAsync();
        var activeVoyages = await _context.ShipVisits.CountAsync(v => v.Status == "Scheduled" || v.Status == "Docked");
        var dockedShips = await _context.ShipVisits.CountAsync(v => v.Status == "Docked");
        var totalCargoTons = await _context.Cargoes.SumAsync(c => c.WeightTons);
        var totalCrew = await _context.CrewMembers.CountAsync();
        var assignedCrew = await _context.ShipCrewAssignments.CountAsync(a => a.EndDate == null || a.EndDate > DateTime.UtcNow);

        result.Fleet = new FleetSummary
        {
            TotalShips = totalShips,
            ActiveVoyages = activeVoyages,
            DockedShips = dockedShips,
            TotalCargoTons = totalCargoTons,
            TotalCrew = totalCrew,
            AssignedCrew = assignedCrew
        };

        return result;
    }
}
