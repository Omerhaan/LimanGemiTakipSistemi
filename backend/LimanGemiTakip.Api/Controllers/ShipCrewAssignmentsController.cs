using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[Route("api/ship-crew-assignments")]
public class ShipCrewAssignmentsController : CrudControllerBase<ShipCrewAssignment>
{
    public ShipCrewAssignmentsController(IShipCrewAssignmentService service)
        : base(service)
    {
    }
}
