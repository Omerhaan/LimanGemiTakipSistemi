using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Operations;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace LimanGemiTakip.Tests;

public class TransactionTests
{
    private readonly ApplicationDbContext _context;
    private readonly OperationService _operationService;

    public TransactionTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);

        // Bağımlılıkları ayağa kaldır
        var shipRepo = new Repository<Ship>(_context);
        var portRepo = new Repository<Port>(_context);
        var visitRepo = new Repository<ShipVisit>(_context);
        var cargoRepo = new Repository<Cargo>(_context);
        var crewRepo = new Repository<CrewMember>(_context);
        var assignRepo = new Repository<ShipCrewAssignment>(_context);

        var visitService = new ShipVisitService(visitRepo, portRepo, shipRepo);
        var cargoService = new CargoService(cargoRepo, shipRepo);
        var assignService = new ShipCrewAssignmentService(assignRepo, shipRepo, crewRepo);

        _operationService = new OperationService(
            _context,
            visitService,
            cargoService,
            assignService,
            NullLogger<OperationService>.Instance);
    }

    [Fact]
    public async Task RegisterFullArrival_WhenValid_CreatesAllEntitiesAtomically()
    {
        // Arrange
        var ship = new Ship { Id = 1, Name = "Akdeniz Gemisi", ImoNumber = "9176187", Flag = "Türkiye", Type = "Konteyner", DeadweightTonnage = 50000 };
        var port = new Port { Id = 1, Name = "Mersin Limanı", Code = "TRMER", Country = "Türkiye", Capacity = 100 };
        var crew = new CrewMember { Id = 1, FirstName = "Ahmet", LastName = "Kaptan", Role = "Kaptan", Email = "ahmet@deniz.com", Phone = "+905321112233" };

        _context.Ships.Add(ship);
        _context.Ports.Add(port);
        _context.CrewMembers.Add(crew);
        await _context.SaveChangesAsync();

        var request = new FullArrivalRequestDto
        {
            ShipId = ship.Id,
            PortId = port.Id,
            ArrivalDate = DateTime.UtcNow.AddDays(1),
            DepartureDate = DateTime.UtcNow.AddDays(3),
            Purpose = "Yükleme Operasyonu",
            Cargoes = new List<CargoItemRequestDto>
            {
                new() { Description = "Konteyner Yükü Lot 1", WeightTons = 1500, Type = "Konteyner", ContainerCount = 50 },
                new() { Description = "Konteyner Yükü Lot 2", WeightTons = 2000, Type = "Konteyner", ContainerCount = 70 }
            },
            CrewAssignments = new List<CrewAssignmentRequestDto>
            {
                new() { CrewMemberId = crew.Id, RoleOnShip = "Kaptan", StartDate = DateTime.UtcNow.AddDays(1), EndDate = DateTime.UtcNow.AddDays(3) }
            }
        };

        // Act
        var result = await _operationService.RegisterFullArrivalAsync(request);

        // Assert
        Assert.True(result.Success);
        Assert.Equal("Committed", result.TransactionStatus);
        Assert.Equal(2, result.CreatedCargoCount);
        Assert.Equal(1, result.CreatedAssignmentCount);

        // Veritabanında kontrol
        var visits = await _context.ShipVisits.ToListAsync();
        var cargoes = await _context.Cargoes.ToListAsync();
        var assignments = await _context.ShipCrewAssignments.ToListAsync();

        Assert.Single(visits);
        Assert.Equal(2, cargoes.Count);
        Assert.Single(assignments);
    }

    [Fact]
    public async Task RegisterFullArrival_WhenFailureSimulated_ThrowsException()
    {
        // Arrange
        var ship = new Ship { Id = 2, Name = "Ege Gemisi", ImoNumber = "9241061", Flag = "Yunanistan", Type = "Tanker", DeadweightTonnage = 30000 };
        var port = new Port { Id = 2, Name = "İzmir Limanı", Code = "TRIZM", Country = "Türkiye", Capacity = 50 };

        _context.Ships.Add(ship);
        _context.Ports.Add(port);
        await _context.SaveChangesAsync();

        var request = new FullArrivalRequestDto
        {
            ShipId = ship.Id,
            PortId = port.Id,
            ArrivalDate = DateTime.UtcNow.AddDays(5),
            DepartureDate = DateTime.UtcNow.AddDays(7),
            Purpose = "Bakım Operasyonu",
            SimulateFailureAtStep = true, // Kasıtlı Hata Simülasyonu!
            SimulationFailureReason = "Sistem Bağlantı Hatası Simülasyonu"
        };

        // Act & Assert (Görev 4: Rollback Testi)
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _operationService.RegisterFullArrivalAsync(request));

        Assert.Contains("Rollback", exception.Message);
    }
}
