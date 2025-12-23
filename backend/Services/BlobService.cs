//This class is used to interact with Azure Blob Storage. I
//it provides methods for uploading, downloading, listing, deleting,

using Azure;
using Azure.Storage.Blobs;
using Azure.Storege.Blobs.Models;
using Azure.Storage.Sas;

namespace backend.Services;

public class BlobService : IBlobService{
    private readonly BlobContainerClient _containerClient; //rchive current files 
    private readonly BlobContainerClient _archiveContainerClient; // store inactive files 
    private readonly ILogger<BlobService> _logger; // log erros

    //this is the constructer it runns every time a object is created     

    public BlobService (IConfiguration configuration , ILogger<BlobService> logger){
        //make the logger private to use in the class
        _logger = logger;

        //read form the aplication.cs the info
        var connectionString = configuration["AzureStorage:ConnectionString"];
        var conatinerName = configuration["AzureStorage:ContainerName"];

        var blobServiceClient = new BlobServiceClient(connectionString);

        _containerClient = blobServiceClient.GetBlobClient(containerName);
        _archiveContainerClient = blobServiceClient.GetBlobContainerClient($"{conatinerName}-archive");

        //create the contatiners if they dont exist
        _containerClient.CreateIfNotExists();
        _archiveContainerClient.CreateIfNotExists();
    }

    //now to uplode file to the blob 
    //to uplde it must organized by user for thet
    // -userId , a file ,returns Truple Containing blobname and full url of the blob

    public async Tassk<(string BlobName,string Url)> UplodeAsync(string userId,IFormFile file){
        try{
            var fileName = Path.GetFileName(file.FileName);

            //create a uniqe file name 
            var blobName = $"{userId}/{Guid.NewGuid()}_{fileName}";
            //get the blob client 
            var blobClient =_containerClient.GetBlobClient(blobName);

            //make shure the browser knows what type pdf or image 
            var BlobHttpHeaders =new BlobHttpHeders{
                _ContentType = file.ContentType
            };

            //open steem and uplode

            using var stream = file.OpenReadStreem();
            await blobClient.UplodeAsync(stream, new BlobUplodeOptions{
                BlobHttpHeaders =BlobHttpHeaders
            });

            _logger.LogInformaation($"File Uploded: {blobName}");

            return (blobName ,blobClient.Url.ToString());
        }
        catch(Exception ex){
            _logger.LogError(ex, "Error Uplodeing File ");
            
            throw;
                    }


    }

    //azure dont have folders 
    //use iEnumreable so that the caller dont kneow its a list

    public async Task<IEnumerable<BlobService>>ListFilesAsync(string userId){
        //create a list to holde the data 
        var file = new List<BlobFileInfo>();

        //befor i used the id as the name so now can filer using the id 
        //the server side can do this

        await foreach (var blobItem in _containerClient.GetBlobsAsync(prifix: $"{userId}/")){
            //now covert azure blobfile to my blobfileinfor DTO
            files.Add(new BlobFileInfo{
                Name = blobItem.Name,
                Size = blobItem.Properties.ContentLength ?? 0,
                LastModified = blobItem.properties.LastModified,
                contentType = blobItem.Properties.contentType ?? "application/octet-stream"
            });
        }
        return files;
    }

    public async Task<bool> DeleteAsync(string blobName){
        try {
            var blobClient = _containerClient.GetBlobClient(blobName);

            await blobClient.DeleteIfExistsAsync();

            _logger.LogInformation($"File deleted : {blobName}");

            return true;
        }
        catch (Exceptioon ex){
            _logger.LogError(ex, $"Error deleting file: {blobName}");
            return false;
        }
    }

    // i need to downloade a blob file without auzre creditioals
    //time limited 
    public async Taask<string>GetsasUrlAsync(string blobName, int ExpiryMinutes = 15){
      try {
        var blobClient =_containerClient.GetBlobClient(blobName);

        //varyfy the blob exists
        if(!await blobClient.ExistsAsync()){
            throw new FileNotFondException("File not found ",blobName);
        }

        var sasBuilder =new BlobSasBuilder{
            BlobContainerName = _containerClient.Name,
            blobName =blobName,
            Resource = "b",

            //start the timmer and end it make this expired 
            StartsOn = DateTimeoffset.UtcNow.AddMinutes(-5),
            ExpiresOn = DateTimeoffset.UtcNow.AddMinutes(ExpiryMinutes)
        };

        //only to read only nothing else 
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        var sasUri =blobClient.GenerateSasUri(sasBuilder);

        _logger.LogInformaation($"Sas URL Genarated for : {blobName},expires in {ExpiryMinutes} minute");

        return sasUri.ToString();
      }  catch (Exception ex){
        _logger.LogError(ex,$"Error generating SAS URL for ;{blobName}");
        throw;
      }
    }

    //make a archive for the old unused files that are not used most of the time
    public async Task<bool> ArchiveAsync(string blobName){
        try{
            //get the main container and then the archive container to
            var sourceBlobClient =_archiveContainerClient.GetBlobClient(blobName);
            var destinationBlobClient =_archiveContainerClient.GetBlobClient(blobName);

            //start the copy
            await destinationBlobClient.StartCopyFromUriAsync(sourceBlobClient.Uri);

            //add a timer to wait to stop it form finshing partialy
            await Task.Delay(1000);

            //now delete the orginal in the main container 
            await sourceBlobClient.DeleteIfExistsAsync();

            _logger.LogInformaation($"File archived:{blobName}");
            return true ;

        }catch(Exception ex ){
            _logger.LogError(ex,$"Error archiving the file : {blobName}");
            return false;

        }
    }

}

