using backend.DTOs;

namespace backend.Services;

public interface IStorageQuotaService
{
    Task<bool> CheckQuotaAsync(int userId, long fileSize);
    Task<StorageQuotaDto> GetQuotaInfoAsync(int userId);
    Task UpdateStorageUsageAsync(int userId, long sizeChange);
    Task<bool> SetQuotaAsync(int userId, long quotaBytes);
    string FormatBytes(long bytes);
}
