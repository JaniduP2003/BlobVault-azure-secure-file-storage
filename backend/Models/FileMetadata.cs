// add all the table attributes for metadata 

//blob uses a name the name used internally in blob storage (e.g., Azure Blob Storage or AWS S3).
//store the filesize and usernale add a uniqe id 
// add the content type Stores the MIME type of the file
// time lastacc ,uplodetime
// add archive and adn arachived or not 

namespace backend.Models;

public class FileMetadata{
    public int Id{ get;set; }
    public string FileName {get; set;} = string.Empty;
    public string BlobName { get; set;} = string.Empty;
    public int UserId {set; get;}  // Changed from string to int to match User.Id
    public long FileSize{set;get;}
    public string ContentType {get;set;} = string.Empty;
    public DateTime UploadedAt { get; set; }
    public DateTime? LastAccessedAt { get; set; }
    public bool IsArchived { get; set; }
    public string? ArchivePath { get; set; }
    
    // Trash/Soft Delete fields
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    
    // Starred field
    public bool IsStarred { get; set; } = false;

    //folder refrence 
    public int? FolderId {get;set;}
    
    // Navigation property
    public User? User { get; set; }
    public Folder? Folder {get;set;}
}
