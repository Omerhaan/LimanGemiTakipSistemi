using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LimanGemiTakip.Tests;

public class SoftDeleteTests
{
    private readonly ApplicationDbContext _context;

    public SoftDeleteTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Delete_WhenEntityDeleted_SetsIsDeletedTrueInsteadOfPhysicalDelete()
    {
        // Arrange
        var ship = new Ship
        {
            Name = "Deneme Gemisi",
            ImoNumber = "9176187",
            Flag = "Türkiye",
            Type = "Konteyner",
            BuiltYear = 2020,
            DeadweightTonnage = 30000
        };
        _context.Ships.Add(ship);
        await _context.SaveChangesAsync();

        // Act - Entity silinir
        _context.Ships.Remove(ship);
        await _context.SaveChangesAsync();

        // Assert - Veri fiziksel olarak silinmemeli, IsDeleted = true olmalı
        var entityInDb = await _context.Ships.IgnoreQueryFilters().FirstOrDefaultAsync(s => s.Id == ship.Id);
        Assert.NotNull(entityInDb);
        Assert.True(entityInDb.IsDeleted);
        Assert.NotNull(entityInDb.UpdatedAt);
    }

    [Fact]
    public async Task Query_WithGlobalFilter_FiltersOutSoftDeletedEntities()
    {
        // Arrange
        var activeShip = new Ship
        {
            Name = "Aktif Gemi",
            ImoNumber = "9176187",
            Flag = "Türkiye",
            Type = "Konteyner",
            BuiltYear = 2021,
            DeadweightTonnage = 20000
        };
        var deletedShip = new Ship
        {
            Name = "Silinmiş Gemi",
            ImoNumber = "9241061",
            Flag = "Yunanistan",
            Type = "Tanker",
            BuiltYear = 2018,
            DeadweightTonnage = 40000
        };

        _context.Ships.AddRange(activeShip, deletedShip);
        await _context.SaveChangesAsync();

        // Silinmiş gemiyi soft delete yap
        _context.Ships.Remove(deletedShip);
        await _context.SaveChangesAsync();

        // Act - Standart sorgu (Global Query Filter aktif)
        var visibleShips = await _context.Ships.ToListAsync();

        // Assert - Sadece aktif olan gemi listelenmeli
        Assert.Single(visibleShips);
        Assert.Equal("Aktif Gemi", visibleShips[0].Name);
    }

    [Fact]
    public async Task Query_WithIgnoreQueryFilters_IncludesSoftDeletedEntities()
    {
        // Arrange
        var ship = new Ship
        {
            Name = "Arşiv Gemisi",
            ImoNumber = "9176187",
            Flag = "Panama",
            Type = "Kuru Yük",
            BuiltYear = 2019,
            DeadweightTonnage = 25000
        };
        _context.Ships.Add(ship);
        await _context.SaveChangesAsync();

        _context.Ships.Remove(ship);
        await _context.SaveChangesAsync();

        // Act - IgnoreQueryFilters ile geçmiş kayıtları sorgula
        var allShipsIncludingDeleted = await _context.Ships.IgnoreQueryFilters().ToListAsync();

        // Assert
        Assert.Single(allShipsIncludingDeleted);
        Assert.Equal("Arşiv Gemisi", allShipsIncludingDeleted[0].Name);
        Assert.True(allShipsIncludingDeleted[0].IsDeleted);
    }

    [Fact]
    public async Task AuditProperties_AutomaticallyPopulated_OnAddAndModify()
    {
        // Arrange & Act - Ekleme
        var port = new Port
        {
            Name = "İzmir Konteyner Limanı",
            Code = "TRIZM",
            Country = "Türkiye",
            City = "İzmir",
            Capacity = 100
        };
        _context.Ports.Add(port);
        await _context.SaveChangesAsync();

        // Assert - Ekleme denetim alanları
        Assert.True(port.CreatedAt > DateTime.UtcNow.AddMinutes(-1));
        Assert.Equal("System", port.CreatedBy);
        Assert.False(port.IsDeleted);

        // Act - Güncelleme
        port.Capacity = 150;
        await _context.SaveChangesAsync();

        // Assert - Güncelleme denetim alanları
        Assert.NotNull(port.UpdatedAt);
        Assert.Equal("System", port.UpdatedBy);
    }
}
