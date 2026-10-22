using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Models.Operations;

namespace LimanGemiTakip.Api.Services;

public interface IShipVisitService : IEntityService<ShipVisit>
{
    Task<List<AvailableShipDto>> GetAvailableShipsAsync(DateTime departureDate, DateTime arrivalDate);
    Task<List<AvailableCrewDto>> GetAvailableCrewAsync(DateTime departureDate, DateTime arrivalDate, string? role = null);
    Task<SafeManningValidationResult> ValidateSafeManningAsync(int shipId, List<int> crewMemberIds);
    Task<DispatchVoyageResponse> DispatchVoyageAsync(DispatchVoyageRequest request);
}
