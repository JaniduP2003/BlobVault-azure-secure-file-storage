using backend.Data;
using backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class StorageQuotaService : IStorageQuotaService
{
    private readonly AppDbContext _context;
    private readonly ILogger<StorageQuotaService> _logger;

    public StorageQuotaService(AppDbContext context, ILogger<StorageQuotaService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> CheckQuotaAsync(int userId, long fileSize)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found for quota check", userId);
            return false;
        }

        var availableSpace = user.StorageQuotaBytes - user.StorageUsedBytes;
        var hasSpace = availableSpace >= fileSize;

        if (!hasSpace)
        {
            _logger.LogWarning(
                "Quota exceeded for user {UserId}. Available: {Available} bytes, Required: {Required} bytes",
                userId, availableSpace, fileSize);
        }

        return hasSpace;
    }

    public async Task<StorageQuotaDto> GetQuotaInfoAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User {userId} not found");
        }

        var availableBytes = user.StorageQuotaBytes - user.StorageUsedBytes;
        var usedPercentage = user.StorageQuotaBytes > 0
            ? (double)user.StorageUsedBytes / user.StorageQuotaBytes * 100
            : 0;

        return new StorageQuotaDto
        {
            StorageQuotaBytes = user.StorageQuotaBytes,
            StorageUsedBytes = user.StorageUsedBytes,
            StorageAvailableBytes = availableBytes,
            StorageUsedPercentage = Math.Round(usedPercentage, 2),
            StorageQuotaFormatted = FormatBytes(user.StorageQuotaBytes),
            StorageUsedFormatted = FormatBytes(user.StorageUsedBytes),
            StorageAvailableFormatted = FormatBytes(availableBytes)
        };
    }

    public async Task UpdateStorageUsageAsync(int userId, long sizeChange)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException($"User {userId} not found");
        }

        user.StorageUsedBytes += sizeChange;
        
        // Ensure storage used doesn't go negative
        if (user.StorageUsedBytes < 0)
        {
            _logger.LogWarning(
                "Storage used for user {UserId} would be negative ({Bytes}), resetting to 0",
                userId, user.StorageUsedBytes);
            user.StorageUsedBytes = 0;
        }

        await _context.SaveChangesAsync();
        
        _logger.LogInformation(
            "Updated storage usage for user {UserId}. Change: {Change} bytes, Total: {Total} bytes",
            userId, sizeChange, user.StorageUsedBytes);
    }

    public async Task<bool> SetQuotaAsync(int userId, long quotaBytes)
    {
        if (quotaBytes < 0)
        {
            _logger.LogWarning("Attempted to set negative quota for user {UserId}", userId);
            return false;
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("User {UserId} not found for quota update", userId);
            return false;
        }

        user.StorageQuotaBytes = quotaBytes;
        await _context.SaveChangesAsync();
        
        _logger.LogInformation(
            "Updated quota for user {UserId} to {Quota} bytes ({Formatted})",
            userId, quotaBytes, FormatBytes(quotaBytes));

        return true;
    }

    public string FormatBytes(long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        double len = bytes;
        int order = 0;
        
        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len /= 1024;
        }

        return $"{len:0.##} {sizes[order]}";
    }
}
