using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LimanGemiTakip.Tests;

public class CargoServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IRepository<Cargo> _cargoRepo;
    private readonly IRepository<Ship> _shipRepo;
    private readonly CargoService _service;

    public CargoServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _cargoRepo = new Repository<Cargo>(_context);
        _shipRepo = new Repository<Ship>(_context);

        _service = new CargoService(_cargoRepo, _shipRepo);

        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.Ships.AddRange(
            new Ship { Id = 1, Name = "Barbaros Express", ImoNumber = "9176187", Flag = "Türkiye", Type = "Konteyner", DeadweightTonnage = 10000 },
            new Ship { Id = 2, Name = "Küçük Yük Gemisi", ImoNumber = "9241061", Flag = "Türkiye", Type = "Kuru Yük", DeadweightTonnage = 2000 }
        );

        _context.Cargoes.AddRange(
            new Cargo { Id = 1, ShipId = 1, Description = "Elektronik Eşya", Type = "Container", WeightTons = 4000m, ContainerCount = 200 }
        );

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateAsync_WithValidCargo_ShouldAddSuccessfully()
    {
        // Arrange (Ship 1 has 10,000 DWT capacity, currently 4,000 loaded, adding 3,000 is valid)
        var newCargo = new Cargo
        {
            ShipId = 1,
            Description = "Tekstil Ürünleri",
            Type = "Container",
            WeightTons = 3000m,
            ContainerCount = 150
        };

        // Act
        var result = await _service.CreateAsync(newCargo);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("Tekstil Ürünleri", result.Description);
        Assert.Equal(3000m, result.WeightTons);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-50)]
    public async Task CreateAsync_WithZeroOrNegativeWeight_ShouldThrowArgumentException(int invalidWeight)
    {
        // Arrange
        var cargo = new Cargo
        {
            ShipId = 1,
            Description = "Hatalı Ağırlık",
            Type = "Bulk",
            WeightTons = invalidWeight
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(cargo));
        Assert.Contains("0'dan büyük olmalıdır", ex.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task CreateAsync_WithEmptyDescription_ShouldThrowArgumentException(string? invalidDesc)
    {
        // Arrange
        var cargo = new Cargo
        {
            ShipId = 1,
            Description = invalidDesc!,
            Type = "General",
            WeightTons = 1000m
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(cargo));
        Assert.Contains("açıklaması zorunludur", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_ExceedingShipDwtCapacity_ShouldThrowArgumentException()
    {
        // Arrange (Ship 1 has 10,000 DWT capacity, currently 4,000 loaded, adding 7,000 exceeds by 1,000)
        var cargo = new Cargo
        {
            ShipId = 1,
            Description = "Ağır Çimento Yükü",
            Type = "Bulk",
            WeightTons = 7000m
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(cargo));
        Assert.Contains("Kapasite Aşımı Güvenlik Uyarısı", ex.Message);
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnCargoWithShip()
    {
        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Elektronik Eşya", result.Description);
        Assert.NotNull(result.Ship);
        Assert.Equal("Barbaros Express", result.Ship.Name);
    }

    [Fact]
    public async Task UpdateAsync_WithValidData_ShouldUpdateSuccessfully()
    {
        // Arrange
        var updateCargo = new Cargo
        {
            ShipId = 1,
            Description = "Güncellenmiş Elektronik",
            Type = "Container",
            WeightTons = 5000m,
            ContainerCount = 250
        };

        // Act
        var result = await _service.UpdateAsync(1, updateCargo);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Güncellenmiş Elektronik", result.Description);
        Assert.Equal(5000m, result.WeightTons);
    }

    [Fact]
    public async Task DeleteAsync_WithValidId_ShouldReturnTrue()
    {
        // Act
        var result = await _service.DeleteAsync(1);

        // Assert
        Assert.True(result);
        var remaining = await _cargoRepo.GetByIdAsync(1);
        Assert.Null(remaining);
    }

    [Fact]
    public async Task DeleteAsync_WithNonExistentId_ShouldReturnFalse()
    {
        // Act
        var result = await _service.DeleteAsync(999);

        // Assert
        Assert.False(result);
    }
}
