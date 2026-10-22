using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LimanGemiTakip.Api.Models.Common;

namespace LimanGemiTakip.Api.Models;

public class Ship : BaseEntity
{
    [Key]
    [Column("ShipId")]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(10)]
    [Column("IMO")]
    public string ImoNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Flag { get; set; } = string.Empty;

    [Column("YearBuilt")]
    public int BuiltYear { get; set; }

    [Column(TypeName = "decimal(12,2)")]
    public decimal DeadweightTonnage { get; set; }
}
