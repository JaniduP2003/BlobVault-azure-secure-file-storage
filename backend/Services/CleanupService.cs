using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Services;

namespace backend.Services;

// this is the code for cleenup that mean it cleens like
//it adds the old unused files to the archive and permently delete Old
//files to cleen up the space 

public class CleanupService:BackgroundService{
    // this inhertes form the backgroundservice in .NET it runs in backgorund 
    // and stops auto when the app stops
    private readonly IServiceProvider _serviceProvider;

    //this for writing logs likie cleenup is stated like that
    //cleen up failed like stuff to
    private readonly ILogger<CleanupService> _logger;

    // frq of the cleen up every 24 h one time only 
    private readonly TimeSpan _interval =TimeSpan.FromHours(24);

    // add a constructor 
    public CleanupService(
        IServiceProvider serviceProvider,
        ILogger<CleanupService>logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

protected override async Task ExecuteAsync(CancellationToken stoppingToken){
    _logger.LogInformation("Cleanup service started and running ");

    while(!stoppingToken.IsCancellationRequested){
        try{
            await DoCleanupAsync();

        }catch(Exception ex) {
            _logger.LogError(ex,"Error in cleanup service ");

        }
        await Task.Delay(_interval,stoppingToken);
    }
} //stoppingToken.IsCancellationRequested == true says to shutdown 
//if its fulse the its on 

//lets do the cleen up
private async Task DoCleanupAsync(){
    //cretate a scope with dependency container 

    using var scope = _serviceProvider.CreateScope();

    // resolve the requred services form the DI 
        // means that above i made a scope only for this so i need to 
        // say what services to use here 
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var blobService = scope.ServiceProvider.GetRequiredService<IBlobService>();
    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

    // reed the setings in apllicaton.json abou the time and delete after -
    var archiveAfterDays = int.Parse(configuration["FileRetention:ArchiveAfterDays"] ?? "90");
    var deleteAfterDays = int.Parse(configuration["FileRetention:DeleteAfterDays"] ?? "180");

    //take the current time to 
    var now = DateTime.UtcNow;

    //find files 
    var filesToArchive = await dbContext.FileMetadata.Where(f =>
                                                            !f.IsArchived &&
                                                            f.UploadedAt < now.AddDays(-archiveAfterDays))
                                                    .ToListAsync();
    
    // loop throgh them and archive them
    foreach(var file in filesToArchive){
        if( await blobService.ArchiveAsync(file.BlobName)){
            file.IsArchived =true;
            file.ArchivePath = $"archive/{file.BlobName}";
        }
    }

    var filesToDelete = await dbContext.FileMetadata.Where(f => 
                                                            f.UploadedAt < now.AddDays(-deleteAfterDays))
                                                    .ToListAsync();
    
    foreach(var file in filesToDelete){
        var blobPath = file.IsArchived ? file.ArchivePath : file.BlobName;
        if (await blobService.DeleteAsync(blobPath)){
            dbContext.FileMetadata.Remove(file);
        }
    }

    // amd find the old old files 

    //save the database chages 

    await dbContext.SaveChangesAsync();

    //log the summery 
    _logger.LogInformation($"Cleanup complete: {filesToArchive.Count} archived, {filesToDelete.Count} deleted");
}
}