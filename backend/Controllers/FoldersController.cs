using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend. Models;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FoldersController:ControllerBase{

    private readonly AppDbContext _context;
    private readonly ILogger<FoldersController> _logger;

    public FoldersController(AppDbContext context, ILogger<FoldersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private int GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdString, out var userId) ? userId : 0;
    }
    // GET: api/folders - Get all folders for current user
    [HttpGet]
    public async Task<IActionResult> GetFolders([FromQuery] int? parentId)
    {
        try
        {
            var userId = GetUserId();

            // Get folders at specified level (or root if parentId is null)
            var folders = await _context.Folders
                .Where(f => f. UserId == userId && f.ParentFolderId == parentId) //Filter only this user’s folders
                .OrderBy(f => f.Name)
                .Select(f => new
                {
                    f.Id,
                    f.Name,
                    f.ParentFolderId,
                    f.Color,
                    f.CreatedAt,
                    f.UpdatedAt,
                    FileCount = f.Files.Count(file => !file.IsDeleted),
                    SubFolderCount = f.SubFolders. Count()
                })
                .ToListAsync(); // only sends whats needed Hides things like UserId or any other internal properties.

            return Ok(folders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting folders");
            return StatusCode(500, new { message = "Error getting folders" });
        }
    }

  // GET: api/folders/{id} - Get specific folder with its contents
    [HttpGet("{id}")]
    public async Task<IActionResult> GetFolder(int id)
    {
        try
        {
            var userId = GetUserId();
            var folder = await _context.Folders
                .Where(f => f.Id == id && f.UserId == userId) //Filter folder by: ID(the folder we wont) and USer ID(to find the user )
                .Select(f => new
                {
                    f.Id,
                    f.Name,
                    f.ParentFolderId,
                    f.Color,
                    f.CreatedAt,
                    f.UpdatedAt,
                    Files = f.Files.Where(file => !file.IsDeleted).Select(file => new
                    {
                        file.Id,
                        file.FileName,
                        file.FileSize,
                        file.ContentType,
                        file. UploadedAt,
                        file.LastAccessedAt,
                        file.IsStarred
                    }),//Only include files that are not soft-deleted.
                    //Returns info like name, size, type, last accessed, and starred status.
                    SubFolders = f.SubFolders.Select(sub => new
                    {
                        sub.Id,
                        sub.Name,
                        sub.Color,
                        sub.CreatedAt,
                        FileCount = sub.Files.Count(file => !file.IsDeleted)
                    }) //Include immediate child folders.
                })
                .FirstOrDefaultAsync();

            if (folder == null)
                return NotFound(new { message = "Folder not found" });

            return Ok(folder);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting folder");
            return StatusCode(500, new { message = "Error getting folder" });
        }
    }

    // POST: api/folders - Create new folder
    [HttpPost]
    public async Task<IActionResult> CreateFolder([FromBody] CreateFolderRequest request)
    {
        try
        {
            var userId = GetUserId();

            
            if (request.ParentFolderId. HasValue)
            {
                var parentExists = await _context.Folders
                    .AnyAsync(f => f.Id == request.ParentFolderId.Value && f.UserId == userId);

                if (!parentExists)
                    return BadRequest(new { message = "Parent folder not found" });
            }//If the new folder is supposed to be inside another folder, 
            // check if that parent folder actually exists and belongs to the user.

            // Check for duplicate name in same location
            // cleeps files neet and cleen 
            var duplicateExists = await _context.Folders
                .AnyAsync(f => f.UserId == userId 
                    && f.ParentFolderId == request.ParentFolderId 
                    && f.Name == request.Name);

            if (duplicateExists)
                return BadRequest(new { message = "A folder with this name already exists in this location" });

            var folder = new Folder
            {
                Name = request.Name,
                UserId = userId,
                ParentFolderId = request.ParentFolderId,
                Color = request.Color ??  "#3b82f6",
                CreatedAt = DateTime. UtcNow
            };

            _context. Folders.Add(folder); //Adds the new folder to the database context. 
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Folder created: {folder.Name} (ID: {folder.Id}) by user {userId}");

            return Ok(new
            {
                folder.Id,
                folder.Name,
                folder.ParentFolderId,
                folder.Color,
                folder.CreatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating folder");
            return StatusCode(500, new { message = "Error creating folder" });
        }
    }

    // PUT: api/folders/{id} - Update folder (rename, change color, move)
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFolder(int id, [FromBody] UpdateFolderRequest request)
    {
        try
        {
            var userId = GetUserId();
            var folder = await _context. Folders
                .FirstOrDefaultAsync(f => f. Id == id && f.UserId == userId);

            if (folder == null)
                return NotFound(new { message = "Folder not found" });

            // Update folder name
            if (!string.IsNullOrWhiteSpace(request.Name))
            {
                // Check for duplicate name
                var duplicateExists = await _context.Folders
                    . AnyAsync(f => f. UserId == userId 
                        && f.ParentFolderId == folder.ParentFolderId 
                        && f.Name == request.Name 
                        && f.Id != id);

                if (duplicateExists)
                    return BadRequest(new { message = "A folder with this name already exists in this location" });

                folder.Name = request.Name;
            }

            // Update color if provided
            if (!string.IsNullOrWhiteSpace(request.Color))
            {
                folder.Color = request.Color;
            }

            // Move to new parent folder if specified
            if (request.ParentFolderId.HasValue)
            {
                // Prevent moving folder into itself or its own subfolder
                // this will brake the structure of files 
                if (await IsDescendantOf(id, request.ParentFolderId.Value))
                    return BadRequest(new { message = "Cannot move folder into itself or its subfolder" });

                folder.ParentFolderId = request.ParentFolderId.Value == 0 ? null : request.ParentFolderId. Value;
            }

            folder.UpdatedAt = DateTime. UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Folder updated: {folder.Name} (ID: {folder.Id})");

            return Ok(new
            {
                folder.Id,
                folder.Name,
                folder.ParentFolderId,
                folder.Color,
                folder.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating folder");
            return StatusCode(500, new { message = "Error updating folder" });
        }
    }

    // DELETE: api/folders/{id} - Delete folder (files move to root)
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFolder(int id)
    {
        try
        {
            var userId = GetUserId(); //gets user
            var folder = await _context. Folders //gets all sub and folders of said user 
                .Include(f => f.Files)
                .Include(f => f.SubFolders)
                .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

            if (folder == null)
                return NotFound(new { message = "Folder not found" });

            // Move all files to root (FolderId = null)
             //if you wont just to delate the folder 
            foreach (var file in folder.Files)
            {
                file.FolderId = folder.ParentFolderId;  // Move to parent folder
            }

            // Move all subfolders to parent
            foreach (var subFolder in folder.SubFolders)
            {
                subFolder.ParentFolderId = folder.ParentFolderId;
            }

            _context.Folders.Remove(folder);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Folder deleted: {folder.Name} (ID: {folder.Id})");

            return Ok(new { message = "Folder deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting folder");
            return StatusCode(500, new { message = "Error deleting folder" });
        }   
    }

    private async Task<bool> IsDescendantOf(int folderId, int potentialAncestorId)
    {
        if (folderId == potentialAncestorId)
            return true;

        var folder = await _context.Folders. FindAsync(folderId);
        if (folder == null || ! folder.ParentFolderId.HasValue)
            return false;

        return await IsDescendantOf(folder.ParentFolderId.Value, potentialAncestorId);
    }

}