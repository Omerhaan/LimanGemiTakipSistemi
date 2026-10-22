using System.Reflection;
using LimanGemiTakip.Api.Controllers;
using Microsoft.AspNetCore.Authorization;
using Xunit;

namespace LimanGemiTakip.Tests;

public class RoleAuthorizationTests
{
    private static AuthorizeAttribute? GetAuthorizeAttribute(Type controllerType, string methodName)
    {
        var method = controllerType.GetMethod(methodName);
        if (method == null) return null;

        // Öncelikli olarak metotta doğrudan tanımlı attribute'u al (override eden)
        var directAttrs = method.GetCustomAttributes<AuthorizeAttribute>(inherit: false).ToArray();
        if (directAttrs.Length > 0)
        {
            return directAttrs[0];
        }

        // Eğer metotta yoksa ata sınıftan devralınanları al
        var allAttrs = method.GetCustomAttributes<AuthorizeAttribute>(inherit: true).ToArray();
        return allAttrs.FirstOrDefault();
    }

    [Theory]
    [InlineData(typeof(CrewMembersController), "Create", "Admin")]
    [InlineData(typeof(CrewMembersController), "Update", "Admin")]
    [InlineData(typeof(ShipsController), "Create", "Admin")]
    [InlineData(typeof(ShipsController), "Update", "Admin")]
    [InlineData(typeof(PortsController), "Create", "Admin")]
    [InlineData(typeof(PortsController), "Update", "Admin")]
    public void MasterDataControllers_CreateAndUpdate_RequireAdminRoleOnly(Type controllerType, string methodName, string expectedRole)
    {
        var authAttr = GetAuthorizeAttribute(controllerType, methodName);

        Assert.NotNull(authAttr);
        Assert.Equal(expectedRole, authAttr.Roles);
    }

    [Theory]
    [InlineData(typeof(ShipVisitsController), "Create", "Admin,Operator")]
    [InlineData(typeof(ShipVisitsController), "Update", "Admin,Operator")]
    [InlineData(typeof(CargoesController), "Create", "Admin,Operator")]
    [InlineData(typeof(CargoesController), "Update", "Admin,Operator")]
    [InlineData(typeof(ShipCrewAssignmentsController), "Create", "Admin,Operator")]
    [InlineData(typeof(ShipCrewAssignmentsController), "Update", "Admin,Operator")]
    public void OperationalControllers_CreateAndUpdate_AllowAdminAndOperator(Type controllerType, string methodName, string expectedRoles)
    {
        var authAttr = GetAuthorizeAttribute(controllerType, methodName);

        Assert.NotNull(authAttr);
        Assert.Equal(expectedRoles, authAttr.Roles);
    }

    [Theory]
    [InlineData(typeof(CrewMembersController), "Delete", "Admin")]
    [InlineData(typeof(ShipsController), "Delete", "Admin")]
    [InlineData(typeof(PortsController), "Delete", "Admin")]
    [InlineData(typeof(ShipVisitsController), "Delete", "Admin")]
    [InlineData(typeof(CargoesController), "Delete", "Admin")]
    [InlineData(typeof(ShipCrewAssignmentsController), "Delete", "Admin")]
    public void AllControllers_DeleteAction_RequiresAdminRoleOnly(Type controllerType, string methodName, string expectedRole)
    {
        var authAttr = GetAuthorizeAttribute(controllerType, methodName);

        Assert.NotNull(authAttr);
        Assert.Equal(expectedRole, authAttr.Roles);
    }

    [Theory]
    [InlineData(typeof(CrewMembersController), "GetAll")]
    [InlineData(typeof(CrewMembersController), "GetPaged")]
    [InlineData(typeof(CrewMembersController), "GetById")]
    [InlineData(typeof(ShipsController), "GetAll")]
    [InlineData(typeof(ShipsController), "GetPaged")]
    [InlineData(typeof(ShipsController), "GetById")]
    [InlineData(typeof(PortsController), "GetAll")]
    [InlineData(typeof(PortsController), "GetPaged")]
    [InlineData(typeof(PortsController), "GetById")]
    [InlineData(typeof(ShipVisitsController), "GetAll")]
    [InlineData(typeof(ShipVisitsController), "GetPaged")]
    [InlineData(typeof(ShipVisitsController), "GetById")]
    [InlineData(typeof(ShipVisitsController), "GetAvailableShips")]
    [InlineData(typeof(ShipVisitsController), "GetAvailableCrew")]
    [InlineData(typeof(CargoesController), "GetAll")]
    [InlineData(typeof(CargoesController), "GetPaged")]
    [InlineData(typeof(CargoesController), "GetById")]
    [InlineData(typeof(ShipCrewAssignmentsController), "GetAll")]
    [InlineData(typeof(ShipCrewAssignmentsController), "GetPaged")]
    [InlineData(typeof(ShipCrewAssignmentsController), "GetById")]
    public void ReadEndpoints_ExposingOperationalOrPersonalData_RequireAuthentication(Type controllerType, string methodName)
    {
        var authAttr = GetAuthorizeAttribute(controllerType, methodName);
        Assert.NotNull(authAttr);
    }

    [Fact]
    public void AuditLogsController_RequiresAdminOrPortManagerRole()
    {
        var classAuth = typeof(AuditLogsController).GetCustomAttributes<AuthorizeAttribute>(inherit: true).FirstOrDefault();
        Assert.NotNull(classAuth);
        Assert.Equal("Admin,PortManager", classAuth.Roles);
    }

    [Fact]
    public void DataSeedController_RequiresAdminRole()
    {
        var classAuth = typeof(DataSeedController).GetCustomAttributes<AuthorizeAttribute>(inherit: true).FirstOrDefault();
        Assert.NotNull(classAuth);
        Assert.Equal("Admin", classAuth.Roles);
    }

    [Fact]
    public void ReportsController_RequiresAuthentication()
    {
        var classAuth = typeof(ReportsController).GetCustomAttributes<AuthorizeAttribute>(inherit: true).FirstOrDefault();
        Assert.NotNull(classAuth);
    }
}
