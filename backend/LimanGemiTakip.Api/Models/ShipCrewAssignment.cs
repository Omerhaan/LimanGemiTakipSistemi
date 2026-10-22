using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LimanGemiTakip.Api.Models.Common;

namespace LimanGemiTakip.Api.Models;

public class ShipCrewAssignment : BaseEntity
{
    [Key]
    [Column("AssignmentId")]
    public int Id { get; set; }

    public int ShipId { get; set; }

    [Column("CrewId")]
    public int CrewMemberId { get; set; }

    [Column("AssignmentDate")]
    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [Required]
    [MaxLength(50)]
    public string RoleOnShip { get; set; } = string.Empty;

    public Ship? Ship { get; set; }

    public CrewMember? CrewMember { get; set; }
}
