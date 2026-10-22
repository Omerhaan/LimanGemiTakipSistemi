using LimanGemiTakip.Api.Models;
using LimanGemiTakip.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LimanGemiTakip.Api.Controllers;

[Route("api/crew-members")]
public class CrewMembersController : CrudControllerBase<CrewMember>
{
    public CrewMembersController(ICrewMemberService service)
        : base(service)
    {
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public override Task<ActionResult<CrewMember>> Create(CrewMember entity)
    {
        return base.Create(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public override Task<ActionResult<CrewMember>> Update(int id, CrewMember entity)
    {
        return base.Update(id, entity);
    }
}
