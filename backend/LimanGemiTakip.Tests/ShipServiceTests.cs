using System.Linq.Expressions;
using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Moq;
using Xunit;

namespace LimanGemiTakip.Tests;

public class ShipServiceTests
{
    private readonly Mock<IRepository<Ship>> _mockRepo;
    private readonly ShipService _shipService;

    public ShipServiceTests()
    {
        _mockRepo = new Mock<IRepository<Ship>>();
        _shipService = new ShipService(_mockRepo.Object);
    }

    [Fact]
    public async Task CreateAsync_WithValidShip_ShouldAddAndReturnShip()
    {
        // Arrange (9176187 is a valid IMO: sum=147, check digit=7)
        var newShip = new Ship
        {
            Name = "TCG Barbaros Express",
            ImoNumber = "9176187",
            Flag = "Türkiye",
            Type = "Konteyner",
            BuiltYear = 2020,
            DeadweightTonnage = 45000
        };

        _mockRepo.Setup(r => r.ExistsAsync(It.IsAny<Expression<Func<Ship, bool>>>()))
            .ReturnsAsync(false);

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<Ship>()))
            .ReturnsAsync((Ship s) =>
            {
                s.Id = 1;
                return s;
            });

        // Act
        var result = await _shipService.CreateAsync(newShip);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("TCG Barbaros Express", result.Name);
        Assert.Equal("9176187", result.ImoNumber);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<Ship>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithDuplicateImoNumber_ShouldThrowArgumentException()
    {
        // Arrange
        var newShip = new Ship
        {
            Name = "Mavi Vatan",
            ImoNumber = "9176187",
            Flag = "Türkiye",
            Type = "Kuru Yük"
        };

        // Mock repository reports that a ship with this IMO already exists
        _mockRepo.Setup(r => r.ExistsAsync(It.IsAny<Expression<Func<Ship, bool>>>()))
            .ReturnsAsync(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _shipService.CreateAsync(newShip));
        Assert.Contains("IMO numarası benzersiz olmalıdır", exception.Message);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<Ship>()), Times.Never);
    }

    [Theory]
    [InlineData("9176188")] // Son basamak 7 olmalıydı, 8 girildi
    [InlineData("1234560")] // Son basamak 7 olmalıydı, 0 girildi
    [InlineData("9074720")] // Son basamak 9 olmalıydı, 0 girildi
    public async Task CreateAsync_WithInvalidImoChecksum_ShouldThrowArgumentException(string invalidImo)
    {
        // Arrange
        var ship = new Ship
        {
            Name = "Akdeniz Yıldızı",
            ImoNumber = invalidImo,
            Flag = "Türkiye",
            Type = "Tanker"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _shipService.CreateAsync(ship));
        Assert.Contains("Geçersiz IMO numarası", exception.Message);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<Ship>()), Times.Never);
    }

    [Theory]
    [InlineData("12345")]
    [InlineData("12345678")]
    [InlineData("ABCDEFG")]
    public async Task CreateAsync_WithInvalidImoLength_ShouldThrowArgumentException(string invalidImo)
    {
        // Arrange
        var ship = new Ship
        {
            Name = "Ege Yolcusu",
            ImoNumber = invalidImo,
            Flag = "Türkiye",
            Type = "Ro-Ro"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _shipService.CreateAsync(ship));
        Assert.Contains("7 basamaklı olmalıdır", exception.Message);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<Ship>()), Times.Never);
    }

    [Theory]
    [InlineData("", "9176187", "Gemi adı zorunludur.")]
    [InlineData("   ", "9176187", "Gemi adı zorunludur.")]
    [InlineData("Akdeniz", "", "IMO numarası zorunludur.")]
    [InlineData("Akdeniz", "   ", "IMO numarası zorunludur.")]
    public async Task CreateAsync_WithInvalidFields_ShouldThrowArgumentException(string name, string imo, string expectedMessage)
    {
        // Arrange
        var ship = new Ship
        {
            Name = name,
            ImoNumber = imo,
            Flag = "Türkiye",
            Type = "Tanker"
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _shipService.CreateAsync(ship));
        Assert.Contains(expectedMessage, exception.Message);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<Ship>()), Times.Never);
    }

    [Theory]
    [InlineData("Konteyner", 45000)]
    [InlineData("Kuru Yük", 32000)]
    [InlineData("Tanker", 65000)]
    [InlineData("LNG / LPG Gaz Tankeri", 50000)]
    [InlineData("Ro-Ro", 15000)]
    [InlineData("Genel Kargo", 12000)]
    [InlineData("Yolcu Gemisi", 8000)]
    [InlineData("Römorkör", 350)]
    [InlineData("Buzkıran & Destek", 5000)]
    [InlineData("Balıkçı Gemisi", 450)]
    public async Task CreateAsync_WithAllRealisticShipTypes_ShouldSucceed(string shipType, decimal dwt)
    {
        // Arrange (9176187 is a valid IMO)
        var ship = new Ship
        {
            Name = $"{shipType} Test Gemisi",
            ImoNumber = "9176187",
            Flag = "Türkiye",
            Type = shipType,
            BuiltYear = 2021,
            DeadweightTonnage = dwt
        };

        _mockRepo.Setup(r => r.ExistsAsync(It.IsAny<Expression<Func<Ship, bool>>>()))
            .ReturnsAsync(false);

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<Ship>()))
            .ReturnsAsync((Ship s) =>
            {
                s.Id = 100;
                return s;
            });

        // Act
        var result = await _shipService.CreateAsync(ship);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(shipType, result.Type);
        Assert.Equal(dwt, result.DeadweightTonnage);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<Ship>()), Times.Once);
    }

    [Fact]
    public async Task CreateAsync_WithNegativeDwt_ShouldThrowArgumentException()
    {
        var ship = new Ship
        {
            Name = "Negatif DWT Gemisi",
            ImoNumber = "9176187",
            Flag = "Türkiye",
            Type = "Konteyner",
            BuiltYear = 2020,
            DeadweightTonnage = -500
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _shipService.CreateAsync(ship));
        Assert.Contains("negatif olamaz", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_WithExcessiveDwt_ShouldThrowArgumentException()
    {
        var ship = new Ship
        {
            Name = "Aşırı Büyük Gemi",
            ImoNumber = "9176187",
            Flag = "Türkiye",
            Type = "Tanker",
            BuiltYear = 2020,
            DeadweightTonnage = 1000000 // 1 milyon ton, imkansız
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _shipService.CreateAsync(ship));
        Assert.Contains("600.000", ex.Message);
    }

    [Theory]
    [InlineData(1850)]
    [InlineData(2999)]
    public async Task CreateAsync_WithInvalidBuiltYear_ShouldThrowArgumentException(int year)
    {
        var ship = new Ship
        {
            Name = "Geçersiz Yıl Gemisi",
            ImoNumber = "9176187",
            Flag = "Türkiye",
            Type = "Kuru Yük",
            BuiltYear = year,
            DeadweightTonnage = 20000
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _shipService.CreateAsync(ship));
        Assert.Contains("Gemi yapım yılı 1900 ile", ex.Message);
    }
}
