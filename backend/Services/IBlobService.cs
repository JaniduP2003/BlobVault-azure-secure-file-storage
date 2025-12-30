//Think of IBlobService as the job description of a 
//post office clerk, and the files are packages.

//Returns (BlobName, Url) → the tracking number and link to access the package. 

// first need to get a blobname and url 
//then using the blpbname mut donload a STREAM (a file)
// and whe asked id then must show whats are inside the blob conatiner 
// adn a delate using the blob name 
//get emep links for 15mins
// and make a bool to move to archive for longthwem storage
using backend.Models;
using System.IO;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services;

public interface IBlobService{
    Task<(string BlobName , string Url)> UploadAsync(string userId , IFormFile file);
    Task<Stream> DownloadAsync(string blobName);
    Task<IEnumerable<BlobFileInfo>> ListFilesAsync(string userId); 
    Task<bool> DeleteAsync(string blobName);
    Task<string> GetSasUrlAsync(string blobName, int ExpiryMinutes =15);
    Task<bool> ArchiveAsync(string blobName);
}