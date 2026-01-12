namespace backend.Models;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    //storage quota fileds
    public long StorageQuotaBytes {get;set;} = 1073741824; 
    public long StorageUsedBytes{get;set;} = 0;

    public bool IsQuotaExceeded => StorageUsedBytes >= StorageQuotaBytes;
    //if its Is the storage usage greater than or equal to the allowed quota?”
    // then true if not fualse 

    public book RemainingStorageBytes => StorageQuotaBytes - StorageUsedBytes;
    
}