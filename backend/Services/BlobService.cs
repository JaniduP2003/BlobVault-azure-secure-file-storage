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
                nameof = blobItem.Name,
                sizeof = blobItem.Properties.ContentLength ?? 0,
                LastModified = blobItem.properties.LastModified,
                contentType = blobItem.Properties.contentType ?? "application/octet-stream"
            });
        }
    }


}

