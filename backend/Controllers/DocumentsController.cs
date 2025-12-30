// this has a logged user can do in the blob like downloading and getall like that

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.Services;
using System.Security.Claims;

namespace backend.Controllers;

//make the base url
[ApiController]
[Route("api/[controller]")]
[Authorize]

public class DocumentsController: ControllerBase{

    private readonly IBlobService _blobService;
    private readonly AppDbContext _context;
    private readonly ILogger<DocumentsController> _logger ;

    public DocumentsController(IBlobService blobService , AppDbContext context ,ILogger<DocumentsController> logger ){
        _blobService = blobService;
        _context = context;
        _logger = logger ;
    }

    private string GetUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
    //ClaimTypes.NameIdentifier its just the name of the autheticated user 
    // the befor claim
    //FindFirst() means “From all the claims inside this token, find the first claim
    // if the claim is true its says true 
    //?.Value dont crash if null came (safty)

    [HttpPost("upload")]
    //IFormFile is a interfece to look inside the formdata body
    public async Task<IActionResult> Upload([FromForm] IFormFile file ){
        if( file == null || file.Length == 0)
            return BadRequest(new{message = "No file provided "});
        if(file.Length > 50 * 1024 * 1024)
            return BadRequest(new{message ="file size exceeds 50mb limit "});
        
  // Validate file type
        var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png", "image/gif", 
            "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
       
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { message = "File type not allowed" });

        try{
            var userId = GetUserId();
            var(blobName, url) = await _blobService.UploadAsync(userId ,file );

            var metadata = new FileMetadata{
                FileName = file.FileName,
                BlobName = blobName,
                UserId = userId, 
                FileSize = file.Length,
                ContentType = file.ContentType,
                UploadedAt = DateTime.UtcNow

            };

            _context.FileMetadata.Add(metadata);
            await _context.SaveChangesAsync();

            return Ok (new{
                id = metadata.Id,
                fileName =metadata.FileName,
                FileSize = metadata.FileSize,
                ContentType = metadata.ContentType,
                uploadedAt = metadata.UploadedAt,
                url
            });
        } catch(Exception ex){
            _logger.LogError(ex,"Error uploding the file ");
            return StatusCode(500,new{ message = "Error uploding the file "});

        }
    
     }

     [HttpGet]
     public async Task<IActionResult> GetFiles(){
        try{
            var userId = GetUserId();
            var files = await _context.FileMetadata.Where(f=> f.UserId == userId 
                                                                    && !f.IsArchived)
                                                    .OrderByDescending(f=> f.UploadedAt)
                                                    .Select(f => new{
                                                        f.Id,
                                                        f.FileName,
                                                        f.FileSize,
                                                        f.ContentType,
                                                        f.UploadedAt,
                                                        f.LastAccessedAt
                                                    }).ToListAsync();
            return Ok(files);
        }
        catch(Exception ex){
            _logger.LogError(ex,"Error listing the files");
            return StatusCode(500,new {message = "Error Listing Files"});
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

            if(file == null ) return NotFound(new {message = "File not found "});

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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var userId = GetUserId();
            var file = await _context.FileMetadata
                .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

            if (file == null)
                return NotFound(new { message = "File not found" });

            await _blobService.DeleteAsync(file.BlobName); // in the blobservise
            // it tells the azure to delate the file 

            // you must delate the metadata becose it lives in another place 
            // not in azure so must delete it 
            _context.FileMetadata.Remove(file);
            await _context.SaveChangesAsync();

            return Ok(new { message = "File deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file");
            return StatusCode(500, new { message = "Error deleting file" });
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


}