using LimanGemiTakip.Api.Data;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace LimanGemiTakip.Tests;

public class PortServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IRepository<Port> _portRepo;
    private readonly PortService _service;

    public PortServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _portRepo = new Repository<Port>(_context);
        _service = new PortService(_portRepo);

        SeedTestData();
    }

    private void SeedTestData()
    {
        _context.Ports.AddRange(
            new Port { Id = 1, Name = "Ambarlı Limanı", Code = "TRIST", Country = "Türkiye", City = "İstanbul", Capacity = 20 },
            new Port { Id = 2, Name = "İzmir Limanı", Code = "TRIZM", Country = "Türkiye", City = "İzmir", Capacity = 15 }
        );

        _context.SaveChanges();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task CreateAsync_WithValidPort_ShouldAddAndReturnPort()
    {
        // Arrange
        var newPort = new Port
        {
            Name = "Mersin Limanı",
            Code = "TRMER",
            Country = "Türkiye",
            City = "Mersin",
            Capacity = 25
        };

        // Act
        var result = await _service.CreateAsync(newPort);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("Mersin Limanı", result.Name);
        Assert.Equal("TRMER", result.Code);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task CreateAsync_WithEmptyName_ShouldThrowArgumentException(string? invalidName)
    {
        // Arrange
        var port = new Port
        {
            Name = invalidName!,
            Code = "TRTEST",
            Capacity = 10
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(port));
        Assert.Contains("Liman adı zorunludur", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WithNegativeCapacity_ShouldThrowArgumentException()
    {
        // Arrange
        var port = new Port
        {
            Name = "Tekirdağ Asyaport",
            Code = "TRASY",
            Capacity = -5
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(port));
        Assert.Contains("Kapasite negatif olamaz", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateCode_ShouldThrowArgumentException()
    {
        // Arrange (TRIST already exists in seed data)
        var port = new Port
        {
            Name = "İstanbul İkinci Liman",
            Code = "TRIST",
            Capacity = 10
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.CreateAsync(port));
        Assert.Contains("Bu liman koduna sahip başka bir liman zaten mevcut", ex.Message);
    }

    [Fact]
    public async Task GetByIdAsync_WithValidId_ShouldReturnPort()
    {
        // Act
        var result = await _service.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Ambarlı Limanı", result.Name);
        Assert.Equal("TRIST", result.Code);
    }

    [Fact]
    public async Task UpdateAsync_WithValidData_ShouldUpdateSuccessfully()
    {
        // Arrange
        var updatePort = new Port
        {
            Name = "Ambarlı Konteyner Limanı",
            Code = "TRIST",
            Country = "Türkiye",
            City = "İstanbul",
            Capacity = 30
        };

        // Act
        var result = await _service.UpdateAsync(1, updatePort);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Ambarlı Konteyner Limanı", result.Name);
        Assert.Equal(30, result.Capacity);
    }

    [Fact]
    public async Task UpdateAsync_WithDuplicateCodeOnOtherPort_ShouldThrowArgumentException()
    {
        // Arrange (Port 2 tries to use Port 1's code TRIST)
        var updatePort = new Port
        {
            Name = "İzmir Limanı Güncel",
            Code = "TRIST",
            Capacity = 15
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateAsync(2, updatePort));
        Assert.Contains("Bu liman koduna sahip başka bir liman zaten mevcut", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_WithNonExistentId_ShouldReturnNull()
    {
        // Arrange
        var updatePort = new Port { Name = "Yok Liman", Code = "TRNONE", Capacity = 5 };

        // Act
        var result = await _service.UpdateAsync(999, updatePort);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task DeleteAsync_WithValidId_ShouldReturnTrue()
    {
        // Act
        var result = await _service.DeleteAsync(1);

        // Assert
        Assert.True(result);
        var remaining = await _portRepo.GetByIdAsync(1);
        Assert.Null(remaining);
    }

    [Fact]
    public async Task DeleteAsync_WithInvalidId_ShouldReturnFalse()
    {
        // Act
        var result = await _service.DeleteAsync(999);

        // Assert
        Assert.False(result);
    }
}
