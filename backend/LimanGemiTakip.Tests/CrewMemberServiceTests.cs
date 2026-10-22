using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Repositories;
using LimanGemiTakip.Api.Services;
using Moq;
using Xunit;

namespace LimanGemiTakip.Tests;

public class CrewMemberServiceTests
{
    private readonly Mock<IRepository<CrewMember>> _mockRepo;
    private readonly CrewMemberService _crewService;

    public CrewMemberServiceTests()
    {
        _mockRepo = new Mock<IRepository<CrewMember>>();
        _crewService = new CrewMemberService(_mockRepo.Object);
    }

    [Fact]
    public async Task GetByIdAsync_WhenCrewMemberExists_ShouldReturnCrewMember()
    {
        // Arrange
        var expected = new CrewMember
        {
            Id = 1,
            FirstName = "Ahmet",
            LastName = "Yılmaz",
            Role = "Kaptan (Master)",
            Email = "ahmet@liman.gov.tr",
            Phone = "+905321112233",
            Nationality = "T.C."
        };

        _mockRepo.Setup(r => r.GetByIdAsync(1))
            .ReturnsAsync(expected);

        // Act
        var result = await _crewService.GetByIdAsync(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Id);
        Assert.Equal("Ahmet", result.FirstName);
        Assert.Equal("Yılmaz", result.LastName);
        Assert.Equal("Ahmet Yılmaz", result.FullName);
        Assert.Equal("Kaptan (Master)", result.Role);
        Assert.Equal("ahmet@liman.gov.tr", result.Email);
        _mockRepo.Verify(r => r.GetByIdAsync(1), Times.Once);
    }

    [Fact]
    public async Task GetCrewById_ShouldCallGetByIdAsyncAndReturnCrewMember()
    {
        // Arrange (Şartnamedeki örnek metot ismi)
        var expected = new CrewMember
        {
            Id = 5,
            FirstName = "Mehmet",
            LastName = "Demir",
            Role = "Çarkçıbaşı",
            Email = "mehmet@deniz.com",
            Phone = "+905332223344"
        };

        _mockRepo.Setup(r => r.GetByIdAsync(5))
            .ReturnsAsync(expected);

        // Act
        var result = await _crewService.GetByIdAsync(5);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Id);
        Assert.Equal("Mehmet Demir", result.FullName);
    }

    [Fact]
    public async Task GetByIdAsync_WhenCrewMemberDoesNotExist_ShouldReturnNull()
    {
        // Arrange
        _mockRepo.Setup(r => r.GetByIdAsync(999))
            .ReturnsAsync((CrewMember?)null);

        // Act
        var result = await _crewService.GetByIdAsync(999);

        // Assert
        Assert.Null(result);
        _mockRepo.Verify(r => r.GetByIdAsync(999), Times.Once);
    }

    [Theory]
    [InlineData("", "Yılmaz", "Personel adı (FirstName) zorunludur.")]
    [InlineData("   ", "Yılmaz", "Personel adı (FirstName) zorunludur.")]
    [InlineData("Ahmet", "", "Personel soyadı (LastName) zorunludur.")]
    [InlineData("Ahmet", "   ", "Personel soyadı (LastName) zorunludur.")]
    public async Task CreateAsync_WithMissingNameFields_ShouldThrowArgumentException(string firstName, string lastName, string expectedMessage)
    {
        // Arrange
        var crew = new CrewMember
        {
            FirstName = firstName,
            LastName = lastName,
            Role = "Güverte Zabiti",
            Email = "zabit@liman.gov.tr",
            Phone = "+905321112233"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _crewService.CreateAsync(crew));
        Assert.Contains(expectedMessage, ex.Message);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<CrewMember>()), Times.Never);
    }

    [Theory]
    [InlineData("gecersiz-email")]
    [InlineData("test@")]
    [InlineData("@deniz.com")]
    [InlineData("test@domain")]
    public async Task CreateAsync_WithInvalidEmail_ShouldThrowArgumentException(string invalidEmail)
    {
        // Arrange
        var crew = new CrewMember
        {
            FirstName = "Mehmet",
            LastName = "Demir",
            Role = "Çarkçıbaşı",
            Email = invalidEmail,
            Phone = "+905332223344"
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _crewService.CreateAsync(crew));
        Assert.Contains("Geçerli bir e-posta", ex.Message);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<CrewMember>()), Times.Never);
    }

    [Theory]
    [InlineData("123")]
    [InlineData("abc")]
    [InlineData("")]
    public async Task CreateAsync_WithInvalidPhone_ShouldThrowArgumentException(string invalidPhone)
    {
        // Arrange
        var crew = new CrewMember
        {
            FirstName = "Ali",
            LastName = "Kaya",
            Role = "Lostromo",
            Email = "ali@liman.gov.tr",
            Phone = invalidPhone
        };

        // Act & Assert
        var ex = await Assert.ThrowsAsync<ArgumentException>(() => _crewService.CreateAsync(crew));
        Assert.Contains("Geçerli bir telefon", ex.Message);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<CrewMember>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_WithValidCrewMember_ShouldAddAndReturn()
    {
        // Arrange
        var validCrew = new CrewMember
        {
            FirstName = "Elena",
            LastName = "Rostova",
            Role = "1. Zabit",
            Email = "elena@ocean.com",
            Phone = "+905554443322",
            Nationality = "Yunanistan"
        };

        _mockRepo.Setup(r => r.AddAsync(It.IsAny<CrewMember>()))
            .ReturnsAsync((CrewMember c) =>
            {
                c.Id = 10;
                return c;
            });

        // Act
        var result = await _crewService.CreateAsync(validCrew);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.Id);
        Assert.Equal("Elena", result.FirstName);
        Assert.Equal("Rostova", result.LastName);
        Assert.Equal("Elena Rostova", result.FullName);
        _mockRepo.Verify(r => r.AddAsync(It.IsAny<CrewMember>()), Times.Once);
    }
}
