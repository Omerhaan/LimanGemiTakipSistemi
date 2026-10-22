using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LimanGemiTakip.Tests;

public class ShipCrewAssignmentServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IRepository<ShipCrewAssignment> _assignmentRepo;
    private readonly IRepository<Ship> _shipRepo;
    private readonly IRepository<CrewMember> _crewRepo;
    private readonly ShipCrewAssignmentService _service;

    public ShipCrewAssignmentServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _assignmentRepo = new Repository<ShipCrewAssignment>(_context);
        _shipRepo = new Repository<Ship>(_context);
        _crewRepo = new Repository<CrewMember>(_context);

        _service = new ShipCrewAssignmentService(_assignmentRepo, _shipRepo, _crewRepo);

        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.Ships.AddRange(
            new Ship { Id = 1, Name = "TCG Barbaros Express", ImoNumber = "9176187", Flag = "Türkiye", Type = "Konteyner", DeadweightTonnage = 45000 },
            new Ship { Id = 2, Name = "Aegean Voyager", ImoNumber = "9354220", Flag = "Yunanistan", Type = "Kuru Yük", DeadweightTonnage = 32000 },
            new Ship { Id = 3, Name = "Blue Horizon Tanker", ImoNumber = "9488316", Flag = "Malta", Type = "Tanker", DeadweightTonnage = 65000 }
        );

        _context.CrewMembers.AddRange(
            new CrewMember { Id = 1, FirstName = "Ahmet", LastName = "Yılmaz", Role = "Kaptan (Master)", Email = "ahmet@liman.gov.tr", Phone = "+905321112233", Nationality = "T.C." },
            new CrewMember { Id = 2, FirstName = "Mehmet", LastName = "Demir", Role = "Çarkçıbaşı", Email = "mehmet@deniz.com", Phone = "+905332223344", Nationality = "T.C." }
        );

        // Mevcut atama: Personel #1, Gemi #1'de 2026-08-22 ile 2026-12-20 arasında görevde
        _context.ShipCrewAssignments.Add(
            new ShipCrewAssignment
            {
                Id = 1,
                ShipId = 1,
                CrewMemberId = 1,
                StartDate = new DateTime(2026, 8, 22),
                EndDate = new DateTime(2026, 12, 20),
                RoleOnShip = "Kaptan"
            }
        );

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateAsync_WhenEndDateIsBeforeStartDate_ThrowsArgumentException()
    {
        // Arrange
        var assignment = new ShipCrewAssignment
        {
            ShipId = 2,
            CrewMemberId = 2,
            StartDate = new DateTime(2026, 10, 1),
            EndDate = new DateTime(2026, 9, 1),
            RoleOnShip = "Çarkçıbaşı"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(assignment));
        Assert.Contains("Görev bitiş tarihi, başlangıç tarihinden önce olamaz", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WhenCrewAssignedToDifferentShipWithOverlappingDates_ThrowsInvalidOperationException()
    {
        // Personel #1 zaten Gemi #1'de (2026-08-22 - 2026-12-20) görevde.
        // Gemi #2'ye 2026-09-28'de atanmaya çalışılıyor -> ÇİFT GEMİ ENGELİ!
        var assignment = new ShipCrewAssignment
        {
            ShipId = 2, // Farklı gemi
            CrewMemberId = 1,
            StartDate = new DateTime(2026, 9, 28),
            EndDate = new DateTime(2027, 2, 22),
            RoleOnShip = "Kaptan"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(assignment));
        Assert.Contains("Çift Gemi Ataması Engeli", ex.Message);
        Assert.Contains("TCG Barbaros Express", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WhenCrewAssignedToSameShipWithOverlappingDates_ThrowsInvalidOperationException()
    {
        // Personel #1 zaten Gemi #1'de (2026-08-22 - 2026-12-20) görevde.
        // Yine Gemi #1'e 2026-09-28 ile 2027-02-22 arasında atanmaya çalışılıyor -> MÜKERRER GÖREV ENGELİ!
        var assignment = new ShipCrewAssignment
        {
            ShipId = 1, // Aynı gemi
            CrewMemberId = 1,
            StartDate = new DateTime(2026, 9, 28),
            EndDate = new DateTime(2027, 2, 22),
            RoleOnShip = "Kaptan"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(assignment));
        Assert.Contains("Mükerrer Görev Engeli", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WhenPreviousAssignmentIsOngoingWithoutEndDate_BlocksNewAssignment()
    {
        // Arrange: Personel #2'nin ucu açık (devam eden) bir ataması olsun
        var ongoing = new ShipCrewAssignment
        {
            ShipId = 2,
            CrewMemberId = 2,
            StartDate = new DateTime(2026, 9, 1),
            EndDate = null, // Devam ediyor
            RoleOnShip = "Çarkçıbaşı"
        };
        await _service.CreateAsync(ongoing);

        // Act: Personel #2'yi Gemi #3'e atamaya çalışalım
        var newAssignment = new ShipCrewAssignment
        {
            ShipId = 3,
            CrewMemberId = 2,
            StartDate = new DateTime(2026, 10, 1),
            EndDate = new DateTime(2027, 1, 1),
            RoleOnShip = "Çarkçıbaşı"
        };

        // Assert: Bloklanmalıdır!
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateAsync(newAssignment));
        Assert.Contains("Çift Gemi Ataması Engeli", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WhenAssignmentDatesDoNotOverlap_SuccessfullyCreatesAssignment()
    {
        // Arrange: Personel #1'in mevcut görevi 2026-12-20'de bitiyor.
        // 2026-12-25'te başlayan yeni bir atama çakışmaz!
        var assignment = new ShipCrewAssignment
        {
            ShipId = 2,
            CrewMemberId = 1,
            StartDate = new DateTime(2026, 12, 25),
            EndDate = new DateTime(2027, 4, 1),
            RoleOnShip = "Kaptan"
        };

        // Act
        var created = await _service.CreateAsync(assignment);

        // Assert
        Assert.NotNull(created);
        Assert.True(created.Id > 0);
        Assert.Equal(2, created.ShipId);
        Assert.Equal(1, created.CrewMemberId);
    }
}
