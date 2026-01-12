namespace backend.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    // Storage quota fields
    public long StorageQuotaBytes { get; set; } = 5L * 1024 * 1024 * 1024; // Default 5GB
    public long StorageUsedBytes { get; set; } = 0;

    // Computed properties
    public bool IsQuotaExceeded => StorageUsedBytes >= StorageQuotaBytes;
    public long RemainingStorageBytes => StorageQuotaBytes - StorageUsedBytes;

    // Navigation property for related files
    public ICollection<FileMetadata> Files { get; set; } = new List<FileMetadata>();
}
