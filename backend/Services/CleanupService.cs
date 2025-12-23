using Microsoft.EntityFrameworkCore;
using SecureDocumentApi.Data;
using backend.Data;

namespace backend.Services;

// this is the code for cleenup that mean it cleens like
//it adds the old unused files to the archive and permently delete Old
//files to cleen up the space 

public class CleanupService:BackgroundService{
    // this inhertes form the backgroundservice in .NET it runs in backgorund 
    // and stops auto when the app stops
    private readonly IserviceProvider _serviceProvider;

    //this for writing logs likie cleenup is stated like that
    //cleen up failed like stuff to
    private readonly ILgger<CleanupService> _logger;

    // frq of the cleen up every 24 h one time only 
    private readonly TimeSpan _interval =TimeSpan.FromHours(24);

    // add a constructor 
    public CleanupService(
        IserviceProvider serviceProvider,
        ILogger<CleenupService>logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

protected override async Task ExercuteAsync(CancellationToken stoppingtoken){
    _logger.LogInformation("cleen up service started and running ");

    while(!stoppingtoken.IsCancellationRequested){
        try{
            await DoCleenupAsync();

        }catch(Exception ex) {
            _logger.LogError(ex,"Error in cleenup service ");

        }
        await Task.Delay(_interval,stoppingtoken);
    }
} //stoppingToken.IsCancellationRequested == true says to shutdown 
//if its fulse the its on 

//lets do the cleen up
private async Task DocleenupAsync(){
    //cretate a scope with dependency container 
    // resolve the requred services form the DI

    // reed the setings in apllicaton.json abou the time and delete after 

    //find files 

    // loop throgh them and archive them

    // amd find the old old files 

    //save the database chages 
}

}