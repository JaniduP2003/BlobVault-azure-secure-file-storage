//This class is used to interact with Azure Blob Storage. I
//it provides methods for uploading, downloading, listing, deleting,

using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using backend.Models;

namespace backend.Services;

public class BlobService : IBlobService{
    private readonly BlobContainerClient _containerClient; //rchive current files 
    private readonly BlobContainerClient _archiveContainerClient; // store inactive files 
    private readonly ILogger<BlobService> _logger; // log erros
    private bool _isInitialized = false;

    //this is the constructer it runns every time a object is created     

    public BlobService (IConfiguration configuration , ILogger<BlobService> logger){
        //make the logger private to use in the class
        _logger = logger;

        //read form the aplication.cs the info
        var connectionString = configuration["AzureStorage:ConnectionString"];
        var containerName = configuration["AzureStorage:ContainerName"];

        var blobServiceClient = new BlobServiceClient(connectionString);

        _containerClient = blobServiceClient.GetBlobContainerClient(containerName);
        _archiveContainerClient = blobServiceClient.GetBlobContainerClient($"{containerName}-archive");

        // Try to create the containers if they don't exist. If storage is unavailable (e.g. Azurite not running),
        // log the error and keep the service alive; individual operations will fail gracefully.
        try
        {
            _containerClient.CreateIfNotExists();
            _archiveContainerClient.CreateIfNotExists();
            // mark as initialized only if creation succeeded
            _isInitialized = true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Azure Blob storage is not available. Blob operations will be disabled until storage is reachable.");
            // leave _isInitialized as false so methods can handle unavailability
        }
    }

    //now to uplode file to the blob 
    //to uplde it must organized by user for thet
    // -userId , a file ,returns Truple Containing blobname and full url of the blob

    public async Task<(string BlobName,string Url)> UploadAsync(string userId,IFormFile file){
        try{
            var fileName = Path.GetFileName(file.FileName);

            //create a uniqe file name 
            var blobName = $"{userId}/{Guid.NewGuid()}_{fileName}";
            //get the blob client 
            var blobClient =_containerClient.GetBlobClient(blobName);

            //make shure the browser knows what type pdf or image 
            var blobHttpHeaders =new BlobHttpHeaders{
                ContentType = file.ContentType
            };

            //open steem and uplode

            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, new BlobUploadOptions{
                HttpHeaders =blobHttpHeaders
            });

            _logger.LogInformation($"File Uploaded: {blobName}");

            return (blobName ,blobClient.Uri.ToString());
        }
        catch(Exception ex){
            _logger.LogError(ex, "Error Uploading File ");
            
            throw;
                    }


    }

    //azure dont have folders 
    //use iEnumreable so that the caller dont kneow its a list

    public async Task<IEnumerable<BlobFileInfo>>ListFilesAsync(string userId){
        //create a list to holde the data 
        var files = new List<BlobFileInfo>();

        //befor i used the id as the name so now can filer using the id 
        //the server side can do this

        if (!_isInitialized)
        {
            _logger.LogWarning("Storage unavailable: ListFilesAsync returning empty list for user {UserId}", userId);
            return files;
        }

        await foreach (var blobItem in _containerClient.GetBlobsAsync(prefix: $"{userId}/")){
            //now covert azure blobfile to my blobfileinfor DTO
            files.Add(new BlobFileInfo{
                Name = blobItem.Name,
                Size = blobItem.Properties.ContentLength ?? 0,
                LastModified = blobItem.Properties.LastModified,
                ContentType = blobItem.Properties.ContentType ?? "application/octet-stream"
            });
        }
        return files;
    }

    public async Task<Stream> DownloadAsync(string blobName)
    {
        try
        {
            if (!_isInitialized) throw new FileNotFoundException("Storage unavailable", blobName);
            var blobClient = _containerClient.GetBlobClient(blobName);
            var response = await blobClient.DownloadAsync();
            return response.Value.Content;
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            _logger.LogError(ex, $"File not found: {blobName}");
            throw new FileNotFoundException("File not found", blobName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error downloading file: {blobName}");
            throw;
        }
    }

    public async Task<bool> DeleteAsync(string blobName){
        try {
            if (!_isInitialized) {
                _logger.LogWarning("Storage unavailable: DeleteAsync skipped for {BlobName}", blobName);
                return false;
            }
            var blobClient = _containerClient.GetBlobClient(blobName);

            await blobClient.DeleteIfExistsAsync();

            _logger.LogInformation($"File deleted : {blobName}");

            return true;
        }
        catch (Exception ex){
            _logger.LogError(ex, $"Error deleting file: {blobName}");
            return false;
        }
    }

    // i need to downloade a blob file without auzre creditioals
    //time limited 
    public async Task<string>GetSasUrlAsync(string blobName, int ExpiryMinutes = 15){
      try {
    if (!_isInitialized) throw new FileNotFoundException("Storage unavailable", blobName);
        var blobClient =_containerClient.GetBlobClient(blobName);

        //varyfy the blob exists
        if(!await blobClient.ExistsAsync()){
            throw new FileNotFoundException("File not found ",blobName);
        }

        var sasBuilder =new BlobSasBuilder{
            BlobContainerName = _containerClient.Name,
            BlobName =blobName,
            Resource = "b",

            //start the timmer and end it make this expired 
            StartsOn = DateTimeOffset.UtcNow.AddMinutes(-5),
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(ExpiryMinutes)
        };

        //only to read only nothing else 
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        var sasUri =blobClient.GenerateSasUri(sasBuilder);

        _logger.LogInformation($"Sas URL Generated for : {blobName},expires in {ExpiryMinutes} minute");

        return sasUri.ToString();
      }  catch (Exception ex){
        _logger.LogError(ex,$"Error generating SAS URL for ;{blobName}");
        throw;
      }
    }

    //make a archive for the old unused files that are not used most of the time
    public async Task<bool> ArchiveAsync(string blobName){
        try{
            if (!_isInitialized) {
                _logger.LogWarning("Storage unavailable: ArchiveAsync skipped for {BlobName}", blobName);
                return false;
            }
            //get the main container and then the archive container to
            var sourceBlobClient =_containerClient.GetBlobClient(blobName);
            var destinationBlobClient =_archiveContainerClient.GetBlobClient(blobName);

            //start the copy
            await destinationBlobClient.StartCopyFromUriAsync(sourceBlobClient.Uri);

            //add a timer to wait to stop it form finshing partialy
            await Task.Delay(1000);

            //now delete the orginal in the main container 
            await sourceBlobClient.DeleteIfExistsAsync();

            _logger.LogInformation($"File archived:{blobName}");
            return true ;

        }catch(Exception ex ){
            _logger.LogError(ex,$"Error archiving the file : {blobName}");
            return false;

        }
    }

}

