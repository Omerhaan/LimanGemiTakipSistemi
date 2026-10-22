using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LimanGemiTakip.Api.Models.Common;

namespace LimanGemiTakip.Api.Models;

public class Cargo : BaseEntity
{
    [Key]
    [Column("CargoId")]
    public int Id { get; set; }

    public int ShipId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Description { get; set; } = string.Empty;

    [Column("WeightTon", TypeName = "decimal(10,2)")]
    public decimal WeightTons { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("CargoType")]
    public string Type { get; set; } = string.Empty;

    public int? ContainerCount { get; set; }

    [MaxLength(50)]
    public string? BillOfLadingNumber { get; set; }

    [MaxLength(30)]
    public string? ImdgClass { get; set; }

    [MaxLength(100)]
    public string? Shipper { get; set; }

    [MaxLength(100)]
    public string? Consignee { get; set; }

    [MaxLength(50)]
    public string? SealNumber { get; set; }

    public Ship? Ship { get; set; }
}
