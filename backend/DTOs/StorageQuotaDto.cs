namespace backend.DTOs;

public class StorageQuotaDto
{
    public long StorageQuotaBytes { get; set; }
    public long StorageUsedBytes { get; set; }
    public long StorageAvailableBytes { get; set; }
    public double StorageUsedPercentage { get; set; }
    public string StorageQuotaFormatted { get; set; } = string.Empty;
    public string StorageUsedFormatted { get; set; } = string.Empty;
    public string StorageAvailableFormatted { get; set; } = string.Empty;
}
