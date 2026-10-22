using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LimanGemiTakip.Tests;

public class ShipVisitServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IRepository<ShipVisit> _visitRepo;
    private readonly IRepository<Port> _portRepo;
    private readonly IRepository<Ship> _shipRepo;
    private readonly ShipVisitService _service;

    public ShipVisitServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _visitRepo = new Repository<ShipVisit>(_context);
        _portRepo = new Repository<Port>(_context);
        _shipRepo = new Repository<Ship>(_context);

        _service = new ShipVisitService(_visitRepo, _portRepo, _shipRepo);

        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.Ports.AddRange(
            new Port { Id = 1, Name = "Ambarlı Limanı", Code = "TRAMB", Country = "Türkiye", City = "İstanbul", Capacity = 2 },
            new Port { Id = 2, Name = "İzmir Alsancak Limanı", Code = "TRIZM", Country = "Türkiye", City = "İzmir", Capacity = 5 }
        );

        _context.Ships.AddRange(
            new Ship { Id = 1, Name = "Barbaros Express", ImoNumber = "9176187", Flag = "Türkiye", Type = "Konteyner", DeadweightTonnage = 50000 },
            new Ship { Id = 2, Name = "Ege Yıldızı", ImoNumber = "9241061", Flag = "Türkiye", Type = "Kuru Yük", DeadweightTonnage = 35000 },
            new Ship { Id = 3, Name = "Akdeniz Kartalı", ImoNumber = "9074729", Flag = "Türkiye", Type = "Tanker", DeadweightTonnage = 40000 }
        );

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateAsync_WhenArrivalDateIsAfterOrEqualDeparture_ThrowsArgumentException()
    {
        var visit = new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = new DateTime(2026, 10, 5, 12, 0, 0),
            DepartureDate = new DateTime(2026, 10, 5, 10, 0, 0), // Arrival > Departure
            Status = "Scheduled"
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(visit));
        Assert.Contains("Geliş tarihi ayrılış tarihinden önce olmalıdır", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WhenValid_AddsVisitSuccessfully()
    {
        var visit = new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = DateTime.Now.AddDays(5),
            DepartureDate = DateTime.Now.AddDays(7),
            Status = "Scheduled",
            DockNumber = "Rıhtım 1"
        };

        var result = await _service.CreateAsync(visit);

        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("Scheduled", result.Status);
    }

    [Fact]
    public async Task CreateAsync_WhenShipHasOverlappingVisitElsewhere_ThrowsInvalidOperationException_DoubleBooking()
    {
        // 1. Gemi 1 için Ambarlı'da 1-3 Ekim arası aktif ziyaret kaydedelim
        await _service.CreateAsync(new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = new DateTime(2026, 10, 1, 10, 0, 0),
            DepartureDate = new DateTime(2026, 10, 3, 18, 0, 0),
            Status = "Scheduled"
        });

        // 2. Aynı Gemi 1 için 2-4 Ekim arası İzmir'de çakışan ziyaret eklemeye çalışalım ("Işınlanma" hatası)
        var conflictingVisit = new ShipVisit
        {
            ShipId = 1,
            PortId = 2,
            ArrivalDate = new DateTime(2026, 10, 2, 12, 0, 0),
            DepartureDate = new DateTime(2026, 10, 4, 12, 0, 0),
            Status = "Scheduled"
        };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(conflictingVisit));
        Assert.Contains("Gemi Çift Rezervasyon (Işınlanma) Engeli", ex.Message);
        Assert.Contains("Barbaros Express", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WhenShipVisitsAreSequentialAndNonOverlapping_Succeeds()
    {
        // 1. Ziyaret: 1-3 Ekim
        await _service.CreateAsync(new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = new DateTime(2026, 10, 1, 10, 0, 0),
            DepartureDate = new DateTime(2026, 10, 3, 10, 0, 0),
            Status = "Scheduled"
        });

        // 2. Ziyaret: 3 Ekim 10:01'de başlayan sonraki sefer (çakışma yok)
        var nextVisit = new ShipVisit
        {
            ShipId = 1,
            PortId = 2,
            ArrivalDate = new DateTime(2026, 10, 3, 10, 1, 0),
            DepartureDate = new DateTime(2026, 10, 5, 10, 0, 0),
            Status = "Scheduled"
        };

        var result = await _service.CreateAsync(nextVisit);
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
    }

    [Fact]
    public async Task CreateAsync_WhenConflictingVisitIsCancelled_DoesNotTriggerDoubleBooking()
    {
        // İptal edilmiş bir ziyaret
        await _service.CreateAsync(new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = new DateTime(2026, 10, 1, 10, 0, 0),
            DepartureDate = new DateTime(2026, 10, 3, 18, 0, 0),
            Status = "Cancelled"
        });

        // Aynı tarih aralığında yeni bir ziyaret eklenmesi engellenmemeli
        var newVisit = new ShipVisit
        {
            ShipId = 1,
            PortId = 2,
            ArrivalDate = new DateTime(2026, 10, 1, 10, 0, 0),
            DepartureDate = new DateTime(2026, 10, 3, 18, 0, 0),
            Status = "Scheduled"
        };

        var result = await _service.CreateAsync(newVisit);
        Assert.NotNull(result);
    }

    [Fact]
    public async Task CreateAsync_WhenPortCapacityReached_ThrowsInvalidOperationException_PortCapacityFull()
    {
        // Ambarlı Limanı kapasitesi = 2
        // Gemi 1: 1-5 Ekim
        await _service.CreateAsync(new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = new DateTime(2026, 10, 1, 10, 0, 0),
            DepartureDate = new DateTime(2026, 10, 5, 10, 0, 0),
            Status = "Scheduled"
        });

        // Gemi 2: 2-4 Ekim (Eşzamanlı gemi sayısı = 2, yani kapasite doldu)
        await _service.CreateAsync(new ShipVisit
        {
            ShipId = 2,
            PortId = 1,
            ArrivalDate = new DateTime(2026, 10, 2, 10, 0, 0),
            DepartureDate = new DateTime(2026, 10, 4, 10, 0, 0),
            Status = "Scheduled"
        });

        // Gemi 3: 3-6 Ekim arası Ambarlı'ya yanaşmak isterse kapasite dolu hatası almalı
        var thirdVisit = new ShipVisit
        {
            ShipId = 3,
            PortId = 1,
            ArrivalDate = new DateTime(2026, 10, 3, 10, 0, 0),
            DepartureDate = new DateTime(2026, 10, 6, 10, 0, 0),
            Status = "Scheduled"
        };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(thirdVisit));
        Assert.Contains("Liman Rıhtım Kapasitesi Dolu", ex.Message);
        Assert.Contains("Ambarlı Limanı", ex.Message);
        Assert.Contains("2 adettir", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WhenUpdatingExistingVisit_DoesNotConflictWithSelf()
    {
        var visit = await _service.CreateAsync(new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = new DateTime(2026, 10, 1, 10, 0, 0),
            DepartureDate = new DateTime(2026, 10, 3, 10, 0, 0),
            Status = "Scheduled",
            DockNumber = "Rıhtım 1"
        });

        // Kendisini güncellerken (aynı gemi, aynı liman, aynı tarihler) çakışma vermemeli
        visit.DockNumber = "Rıhtım 2";
        var updated = await _service.UpdateAsync(visit.Id, visit);

        Assert.NotNull(updated);
        Assert.Equal("Rıhtım 2", updated.DockNumber);
    }

    [Fact]
    public async Task GetPagedAsync_WhenFilteringByStatus_ReturnsOnlyMatchingVisits()
    {
        var now = DateTime.Now;

        // 1. Geçmiş sefer (Departed)
        await _service.CreateAsync(new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = now.AddDays(-5),
            DepartureDate = now.AddDays(-2),
            Status = "Departed",
            DockNumber = "R-1"
        });

        // 2. Şu anki sefer (Docked)
        await _service.CreateAsync(new ShipVisit
        {
            ShipId = 2,
            PortId = 2,
            ArrivalDate = now.AddDays(-1),
            DepartureDate = now.AddDays(2),
            Status = "Docked",
            DockNumber = "R-2"
        });

        // 3. Gelecek sefer (Scheduled)
        await _service.CreateAsync(new ShipVisit
        {
            ShipId = 3,
            PortId = 1,
            ArrivalDate = now.AddDays(3),
            DepartureDate = now.AddDays(6),
            Status = "Scheduled",
            DockNumber = "R-3"
        });

        // Test Docked
        var dockedResult = await _service.GetPagedAsync(new LimanGemiTakip.Api.Models.Common.PaginationParams
        {
            Status = "Docked",
            PageSize = 10
        });
        Assert.Single(dockedResult.Items);
        Assert.Equal("Docked", dockedResult.Items[0].Status);

        // Test Scheduled
        var scheduledResult = await _service.GetPagedAsync(new LimanGemiTakip.Api.Models.Common.PaginationParams
        {
            Status = "Scheduled",
            PageSize = 10
        });
        Assert.Single(scheduledResult.Items);
        Assert.Equal("Scheduled", scheduledResult.Items[0].Status);

        // Test Departed
        var departedResult = await _service.GetPagedAsync(new LimanGemiTakip.Api.Models.Common.PaginationParams
        {
            Status = "Departed",
            PageSize = 10
        });
        Assert.Single(departedResult.Items);
        Assert.Equal("Departed", departedResult.Items[0].Status);
    }
}
