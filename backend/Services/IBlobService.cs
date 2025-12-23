//Think of IBlobService as the job description of a 
//post office clerk, and the files are packages.

//Returns (BlobName, Url) → the tracking number and link to access the package. 

// first need to get a blobname and url 
//then using the blpbname mut donload a STREAM (a file)
// and whe asked id then must show whats are inside the blob conatiner 
// adn a delate using the blob name 
//get emep links for 15mins
// and make a bool to move to archive for longthwem storage

namespace backend.Services;

public interface IblobService{
    Task<(string blobName , string Url)> uplodeAsync(string userId , IFormFile file);
    Task<stream> DownloadAsync(string blobName);
    Task<IEnumerable<BlobFileInfo>> ListFilesAsync(string userid); 
    Task<bool> DeleteAsync(string blobName);
    Task<string> GetSasUrlAsync(string blobName, int ExpiryMinutes =15);
    Task<bool> ArchiveAsync(string blobName);
}

// above i made a blobfileinfr now lets make the attributes

public class BlobFileInfo { 
    public string  Name {get;set;} = string.Empty;
    public long Size {get;set;} 
    public DateTimeOffset? LastModified {get;set;}
    public string contentType {get;set; } =string.Empty;
}