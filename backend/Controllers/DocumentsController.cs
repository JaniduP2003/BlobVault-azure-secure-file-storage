// this has a logged user can do in the blob like downloading and getall like that

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;
using System.Security.Claims;
using Microsoft.AspNetCore.Http.Features;

namespace backend.Controllers;

//make the base url
[ApiController]
[Route("api/[controller]")]
[Authorize]

public class DocumentsController : ControllerBase
{

    private readonly IBlobService _blobService;
    private readonly AppDbContext _context;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(IBlobService blobService, AppDbContext context, ILogger<DocumentsController> logger)
    {
        _blobService = blobService;
        _context = context;
        _logger = logger;
    }

    private int GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdString, out var userId) ? userId : 0;
    }
    //ClaimTypes.NameIdentifier its just the name of the autheticated user 
    // the befor claim
    //FindFirst() means “From all the claims inside this token, find the first claim
    // if the claim is true its says true 
    //?.Value dont crash if null came (safty)


    // get the current users current storage usage 
    private async Task<long> CalculateUserStorageUsage(int userId)
    {
        return await _context.FileMetadata
            .Where(f => f.UserId == userId && !f.IsDeleted)
            .SumAsync(f => f.FileSize);
    }

    // get the current users storage info all of them     
    [HttpGet("storage-info")]
    public async Task<IActionResult> GetStorageInfo()
    {
        try
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            //Load user from database

            if (user == null)
                return NotFound(new { message = "User not found" });

            // Calculate actual storage used
            var actualStorageUsed = await CalculateUserStorageUsage(userId);
            // above methode is called here 


            // Update user's storage if it's out of sync
            if (user.StorageUsedBytes != actualStorageUsed)
            {
                user.StorageUsedBytes = actualStorageUsed;
                await _context.SaveChangesAsync();
            }

            //gets everything in in mb ,get user % to 
            return Ok(new
            {
                storageQuotaBytes = user.StorageQuotaBytes,
                storageUsedBytes = user.StorageUsedBytes,
                remainingBytes = user.RemainingStorageBytes,
                storageQuotaMB = user.StorageQuotaBytes / (1024.0 * 1024.0),
                storageUsedMB = user.StorageUsedBytes / (1024.0 * 1024.0),
                remainingMB = user.RemainingStorageBytes / (1024.0 * 1024.0),
                usagePercentage = (double)user.StorageUsedBytes / user.StorageQuotaBytes * 100,
                isQuotaExceeded = user.IsQuotaExceeded
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting storage info");
            return StatusCode(500, new { message = "Error getting storage info" });
        }
    }
    [HttpPost("upload")]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100MB limit
    [RequestFormLimits(MultipartBodyLengthLimit = 100 * 1024 * 1024)] // 100MB limit for multipart forms
    //IFormFile is a interfece to look inside the formdata body
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] int? folderId)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided " });
        if (file.Length > 100 * 1024 * 1024)
            return BadRequest(new { message = "file size exceeds 100mb limit " });

        // Validate file type - expanded to support more common file types
        var allowedTypes = new[] { 
            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "text/csv",
            "application/rtf",
            // Images
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "image/svg+xml",
            "image/bmp",
            // Archives
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/x-7z-compressed",
            "application/gzip",
            // Other
            "application/json",
            "application/xml",
            "text/xml"
        };

        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { message = $"File type '{file.ContentType}' not allowed" });

        try
        {
            var userId = GetUserId();

        if (folderId.HasValue && folderId.Value > 0)
        {
            var folderExists = await _context. Folders
                .AnyAsync(f => f.Id == folderId.Value && f.UserId == userId);

            if (!folderExists)
                return BadRequest(new { message = "Folder not found" });
        }

            // the storage cheack and other 
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return Unauthorized(new { message = "User not found" });

            // Calculate current storage usage
            var currentStorageUsed = await CalculateUserStorageUsage(userId);

            // if the new file added will exceed the ammont of storage then reject 
            // fist cheack it 
            if (currentStorageUsed + file.Length > user.StorageQuotaBytes)
            {
                var remainingBytes = user.StorageQuotaBytes - currentStorageUsed;
                var remainingMB = remainingBytes / (1024.0 * 1024.0);

                _logger.LogWarning($"User {userId} attempted to upload {file.Length} bytes but only has {remainingBytes} bytes remaining");

                return StatusCode(507, new // 507 Insufficient Storage
                {
                    message = "Storage quota exceeded",
                    storageQuotaBytes = user.StorageQuotaBytes,
                    storageUsedBytes = currentStorageUsed,
                    remainingBytes = remainingBytes,
                    remainingMB = Math.Round(remainingMB, 2),
                    fileSize = file.Length,
                    fileSizeMB = Math.Round(file.Length / (1024.0 * 1024.0), 2)
                });
            }
            //uplode to blob storage 
            var (blobName, url) = await _blobService.UploadAsync(userId.ToString(), file);

            //save metadata
            var metadata = new FileMetadata
            {
                FileName = file.FileName,
                BlobName = blobName,
                UserId = userId,
                FileSize = file.Length,
                ContentType = file.ContentType,
                UploadedAt = DateTime.UtcNow,
                FolderId = folderId 

            };

            _context.FileMetadata.Add(metadata);

            // update the users new storage ammount after the new files is uploded 
            user.StorageUsedBytes = currentStorageUsed + file.Length;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = metadata.Id,
                fileName = metadata.FileName,
                FileSize = metadata.FileSize,
                ContentType = metadata.ContentType,
                uploadedAt = metadata.UploadedAt,
                url,

                folderId = metadata.FolderId, 

                storageUsedBytes = user.StorageUsedBytes,
                storageQuotaBytes = user.StorageQuotaBytes,
                remainingBytes = user.RemainingStorageBytes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploding the file ");
            return StatusCode(500, new { message = "Error uploding the file " });

        }

    }

    [HttpGet]
    public async Task<IActionResult> GetFiles()
    {
        try
        {
            var userId = GetUserId();
            var files = await _context.FileMetadata.Where(f => f.UserId == userId
                                                                    && !f.IsArchived
                                                                    && !f.IsDeleted)
                                                    .OrderByDescending(f => f.UploadedAt)
                                                    .Select(f => new
                                                    {
                                                        f.Id,
                                                        f.FileName,
                                                        f.FileSize,
                                                        f.ContentType,
                                                        f.UploadedAt,
                                                        f.LastAccessedAt,
                                                        f.IsStarred
                                                    }).ToListAsync();
            return Ok(files);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing the files");
            return StatusCode(500, new { message = "Error Listing Files" });
        }
    }


    [HttpGet("download/{id}")]
    public async Task<IActionResult> Download(int id)
    {
        try
        {
            var userId = GetUserId(); // the one () you made above 
            var file = await _context.FileMetadata.FirstOrDefaultAsync(
                                                    f => f.Id == id &&
                                                    f.UserId == userId
                                                    );
            //“From the database, find the first file whose Id matches 
            // id and belongs to the current user.

            if (file == null) return NotFound(new { message = "File not found " });

            var stream = await _blobService.DownloadAsync(file.BlobName);

            //need to udpadte the time for the new accessed
            file.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return File(stream, file.ContentType, file.FileName);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "File not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading file");
            return StatusCode(500, new { message = "Error downloading file" });
        }
    }

    [HttpGet("preview/{id}")]
    public async Task<IActionResult> Preview(int id)
    {
        try
        {
            var userId = GetUserId();
            var file = await _context.FileMetadata.FirstOrDefaultAsync(
                                                    f => f.Id == id &&
                                                    f.UserId == userId
                                                    );

            if (file == null) return NotFound(new { message = "File not found " });

            var stream = await _blobService.DownloadAsync(file.BlobName);

            // Update last accessed time
            file.LastAccessedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Return file with inline disposition for preview in browser
            Response.Headers.Append("Content-Disposition", $"inline; filename=\"{file.FileName}\"");
            return File(stream, file.ContentType);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { message = "File not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing file");
            return StatusCode(500, new { message = "Error previewing file" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var userId = GetUserId();
            var file = await _context.FileMetadata
                .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId && !f.IsDeleted);

            if (file == null)
                return NotFound(new { message = "File not found" });

            // Soft delete - move to trash
            file.IsDeleted = true;
            file.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "File moved to trash" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error moving file to trash");
            return StatusCode(500, new { message = "Error moving file to trash" });
        }
    }

    // Get all trashed files
    [HttpGet("trash")]
    public async Task<IActionResult> GetTrashedFiles()
    {
        try
        {
            var userId = GetUserId();
            var trashedFiles = await _context.FileMetadata
                .Where(f => f.UserId == userId && f.IsDeleted)
                .OrderByDescending(f => f.DeletedAt)
                .Select(f => new
                {
                    f.Id,
                    f.FileName,
                    f.FileSize,
                    f.ContentType,
                    f.UploadedAt,
                    f.LastAccessedAt,
                    f.DeletedAt,
                    f.IsStarred
                })
                .ToListAsync();

            return Ok(trashedFiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing trashed files");
            return StatusCode(500, new { message = "Error listing trashed files" });
        }
    }

    // Restore file from trash
    [HttpPost("{id}/restore")]
    public async Task<IActionResult> RestoreFile(int id)
    {
        try
        {
            var userId = GetUserId();
            var file = await _context.FileMetadata
                .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId && f.IsDeleted);

            if (file == null)
                return NotFound(new { message = "File not found in trash" });

            // Restore file
            file.IsDeleted = false;
            file.DeletedAt = null;
            await _context.SaveChangesAsync();

            return Ok(new { message = "File restored successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring file");
            return StatusCode(500, new { message = "Error restoring file" });
        }
    }

    // Permanently delete file from trash
    [HttpDelete("{id}/permanent")]
    public async Task<IActionResult> PermanentDelete(int id)
    {
        try
        {
            var userId = GetUserId();
            var file = await _context.FileMetadata
                .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId && f.IsDeleted);

            if (file == null)
                return NotFound(new { message = "File not found in trash" });

            // Delete from blob storage
            await _blobService.DeleteAsync(file.BlobName);


            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.StorageUsedBytes -= file.FileSize;
                if (user.StorageUsedBytes < 0) user.StorageUsedBytes = 0; // Safety check
            }

            // Delete metadata from database
            _context.FileMetadata.Remove(file);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"File deleted: {file.BlobName}. User {userId} storage: {user?.StorageUsedBytes}/{user?.StorageQuotaBytes} bytes");


            return Ok(new
            {
                message = "File permanently deleted",
                storageUsedBytes = user?.StorageUsedBytes,
                storageQuotaBytes = user?.StorageQuotaBytes,
                remainingBytes = user?.RemainingStorageBytes
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error permanently deleting file");
            return StatusCode(500, new { message = "Error permanently deleting file" });
        }
    }

    // Empty trash - permanently delete all trashed files
    [HttpDelete("trash/empty")]
    public async Task<IActionResult> EmptyTrash()
    {
        try
        {
            var userId = GetUserId();
            var trashedFiles = await _context.FileMetadata
                .Where(f => f.UserId == userId && f.IsDeleted)
                .ToListAsync();

            if (trashedFiles.Count == 0)
                return Ok(new { message = "Trash is already empty", deletedCount = 0 });

            // Delete all files from blob storage
            foreach (var file in trashedFiles)
            {
                try
                {
                    await _blobService.DeleteAsync(file.BlobName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, $"Failed to delete blob {file.BlobName}");
                    // Continue with other files even if one fails
                }
            }

            // Delete all metadata from database
            _context.FileMetadata.RemoveRange(trashedFiles);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Trash emptied successfully", deletedCount = trashedFiles.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error emptying trash");
            return StatusCode(500, new { message = "Error emptying trash" });
        }
    }

    // Star/Unstar file
    [HttpPost("{id}/star")]
    public async Task<IActionResult> ToggleStar(int id)
    {
        try
        {
            var userId = GetUserId();
            var file = await _context.FileMetadata
                .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId && !f.IsDeleted);

            if (file == null)
                return NotFound(new { message = "File not found" });

            // Toggle star status
            file.IsStarred = !file.IsStarred;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = file.IsStarred ? "File starred" : "File unstarred",
                isStarred = file.IsStarred
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling star status");
            return StatusCode(500, new { message = "Error updating star status" });
        }
    }

    // Get starred files
    [HttpGet("starred")]
    public async Task<IActionResult> GetStarredFiles()
    {
        try
        {
            var userId = GetUserId();
            var starredFiles = await _context.FileMetadata
                .Where(f => f.UserId == userId && f.IsStarred && !f.IsDeleted)
                .OrderByDescending(f => f.UploadedAt)
                .Select(f => new
                {
                    f.Id,
                    f.FileName,
                    f.FileSize,
                    f.ContentType,
                    f.UploadedAt,
                    f.LastAccessedAt,
                    f.IsStarred
                })
                .ToListAsync();

            return Ok(starredFiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing starred files");
            return StatusCode(500, new { message = "Error listing starred files" });
        }
    }

    // Get recent files (last 30 days, ordered by last accessed)
    [HttpGet("recent")]
    public async Task<IActionResult> GetRecentFiles()
    {
        try
        {
            var userId = GetUserId();
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            
            var recentFiles = await _context.FileMetadata
                .Where(f => f.UserId == userId && !f.IsDeleted && f.LastAccessedAt >= thirtyDaysAgo)
                .OrderByDescending(f => f.LastAccessedAt)
                .Select(f => new
                {
                    f.Id,
                    f.FileName,
                    f.FileSize,
                    f.ContentType,
                    f.UploadedAt,
                    f.LastAccessedAt,
                    f.IsStarred
                })
                .ToListAsync();

            return Ok(recentFiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error listing recent files");
            return StatusCode(500, new { message = "Error listing recent files" });
        }
    }


    [HttpGet("share/{id}")]
    //maake a temp link for dowlade 
    public async Task<IActionResult> GenerateShareLink(int id, [FromQuery] int expiryMinutes = 15)
    // [fromQuery] is “Read this value from the URL query string.”
    // if not provided use defult ?expiryMinutes=30
    {
        try
        {
            if (expiryMinutes < 1 || expiryMinutes > 1440) // Max 24 hours
                return BadRequest(new { message = "Expiry must be between 1 and 1440 minutes" });
            // better security cant get a link forever 

            var userId = GetUserId();
            var file = await _context.FileMetadata
                .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

            if (file == null)
                return NotFound(new { message = "File not found" });

            var sasUrl = await _blobService.GetSasUrlAsync(file.BlobName, expiryMinutes);
            //SAS = Shared Access Signature It is:
            // A normal blob URL , With a cryptographic token ,Grants temporary permissions

            return Ok(new
            {
                fileName = file.FileName,
                shareUrl = sasUrl,
                expiresIn = expiryMinutes,
                expiresAt = DateTime.UtcNow.AddMinutes(expiryMinutes)
            }); // this is jason resonse back to cliant 
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating share link");
            return StatusCode(500, new { message = "Error generating share link" });
        }
    }

[HttpGet("by-folder/{folderId}")]
public async Task<IActionResult> GetFilesByFolder(int folderId)
{
    try
    {
        var userId = GetUserId();

        // Verify folder belongs to user
        var folderExists = await _context. Folders
            .AnyAsync(f => f.Id == folderId && f.UserId == userId);

        if (!folderExists)
            return NotFound(new { message = "Folder not found" });

        var files = await _context.FileMetadata
            .Where(f => f.UserId == userId && f.FolderId == folderId && !f.IsDeleted)
            .OrderByDescending(f => f. UploadedAt)
            .Select(f => new
            {
                f.Id,
                f.FileName,
                f. FileSize,
                f.ContentType,
                f.UploadedAt,
                f. LastAccessedAt,
                f.IsStarred,
                f.FolderId
            })
            .ToListAsync();

        return Ok(files);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error getting files by folder");
        return StatusCode(500, new { message = "Error getting files" });
    }
}

// Move file to different folder
[HttpPut("{id}/move")]
public async Task<IActionResult> MoveFile(int id, [FromBody] MoveFileRequest request)
{
    try
    {
        var userId = GetUserId();
        var file = await _context.FileMetadata
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

        if (file == null)
            return NotFound(new { message = "File not found" });

        // Validate target folder exists if provided
        if (request.FolderId.HasValue && request.FolderId.Value > 0)
        {
            var folderExists = await _context.Folders
                .AnyAsync(f => f.Id == request.FolderId.Value && f.UserId == userId);

            if (!folderExists)
                return BadRequest(new { message = "Target folder not found" });
        }

        file.FolderId = request.FolderId;
        await _context.SaveChangesAsync();

        _logger.LogInformation($"File {file.FileName} moved to folder {request.FolderId}");

        return Ok(new { message = "File moved successfully", folderId = file.FolderId });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error moving file");
        return StatusCode(500, new { message = "Error moving file" });
    }
}

}