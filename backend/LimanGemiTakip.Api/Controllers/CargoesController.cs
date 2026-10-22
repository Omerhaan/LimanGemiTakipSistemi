using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[Route("api/cargoes")]
public class CargoesController : CrudControllerBase<Cargo>
{
    public CargoesController(ICargoService service)
        : base(service)
    {
    }
}
