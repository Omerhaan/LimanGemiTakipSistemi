using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace LimanGemiTakip.Tests;

public class ConcurrencyTests
{
    private readonly ApplicationDbContext _context;
    private readonly ShipVisitService _visitService;

    public ConcurrencyTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);

        var visitRepo = new Repository<ShipVisit>(_context);
        var portRepo = new Mock<IRepository<Port>>();
        var shipRepo = new Mock<IRepository<Ship>>();

        portRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(new Port { Id = 1, Name = "Test Liman", Capacity = 100 });
        shipRepo.Setup(r => r.GetByIdAsync(It.IsAny<int>())).ReturnsAsync(new Ship { Id = 1, Name = "Test Gemi", DeadweightTonnage = 50000 });

        _visitService = new ShipVisitService(visitRepo, portRepo.Object, shipRepo.Object);
    }

    [Fact]
    public async Task UpdateAsync_WhenRowVersionMismatch_ThrowsDbUpdateConcurrencyException()
    {
        // Arrange
        var initialRowVersion = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 };
        var staleRowVersion = new byte[] { 8, 7, 6, 5, 4, 3, 2, 1 }; // Farklı/eski token

        var visit = new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = DateTime.UtcNow.AddDays(1),
            DepartureDate = DateTime.UtcNow.AddDays(3),
            Purpose = "İlk Amaç",
            Status = "Scheduled",
            RowVersion = initialRowVersion
        };
        _context.ShipVisits.Add(visit);
        await _context.SaveChangesAsync();

        var updateRequest = new ShipVisit
        {
            Id = visit.Id,
            ShipId = 1,
            PortId = 1,
            ArrivalDate = DateTime.UtcNow.AddDays(1),
            DepartureDate = DateTime.UtcNow.AddDays(3),
            Purpose = "Kullanıcı B tarafından güncellenen amaç",
            Status = "Scheduled",
            RowVersion = staleRowVersion // Uyuşmayan token!
        };

        // Act & Assert (Görev 5: Optimistic Concurrency Mismatch)
        var exception = await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() =>
            _visitService.UpdateAsync(visit.Id, updateRequest));

        Assert.Contains("Eş zamanlı güncelleme çakışması", exception.Message);
    }

    [Fact]
    public async Task UpdateAsync_WhenRowVersionMatches_UpdatesSuccessfully()
    {
        // Arrange
        var validRowVersion = new byte[] { 1, 2, 3, 4, 5, 6, 7, 8 };

        var visit = new ShipVisit
        {
            ShipId = 1,
            PortId = 1,
            ArrivalDate = DateTime.UtcNow.AddDays(1),
            DepartureDate = DateTime.UtcNow.AddDays(3),
            Purpose = "Orijinal Amaç",
            Status = "Scheduled",
            RowVersion = validRowVersion
        };
        _context.ShipVisits.Add(visit);
        await _context.SaveChangesAsync();

        var updateRequest = new ShipVisit
        {
            Id = visit.Id,
            ShipId = 1,
            PortId = 1,
            ArrivalDate = DateTime.UtcNow.AddDays(1),
            DepartureDate = DateTime.UtcNow.AddDays(3),
            Purpose = "Yeni Güncel Amaç",
            Status = "Scheduled",
            RowVersion = validRowVersion // Eşleşen token
        };

        // Act
        var result = await _visitService.UpdateAsync(visit.Id, updateRequest);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Yeni Güncel Amaç", result.Purpose);
    }
}
