using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using LimanGemiTakip.Api.Models.Common;

namespace LimanGemiTakip.Api.Models;

public class ShipVisit : BaseEntity
{
    [Key]
    [Column("VisitId")]
    public int Id { get; set; }

    public int ShipId { get; set; }

    public int? OriginPortId { get; set; }

    public int PortId { get; set; }

    public DateTime ArrivalDate { get; set; }

    public DateTime DepartureDate { get; set; }

    [MaxLength(100)]
    public string Purpose { get; set; } = "Operasyon";

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Scheduled";

    [MaxLength(20)]
    public string? DockNumber { get; set; }

    [Timestamp]
    public byte[]? RowVersion { get; set; }

    public Ship? Ship { get; set; }

    public Port? OriginPort { get; set; }

    public Port? Port { get; set; }
}
