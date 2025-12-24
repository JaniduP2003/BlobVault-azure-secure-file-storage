//this is were the data is stored
//so need to use DbContext , DbSet<T> ,ModelBuilder so needs enettity framework
//inmort the models here and decleare the data 

using Microsoft.EntityFrameworkCore;
using backend.Models;

// namespace declaration.
namespace backend.Data;

//the class name is appdbcontext and it INHARITES form DbContext
public class Appdbcontext:Dbcontext{
    //above made the appdbcotext now lets add the setting inside 
    public Appdbcontext(DbContextOptions<Appdbcontext> options ): base(options) {}

    //{ get; set; } = Read/Write Access
    // ther is two shelfs of users and metadata in the DB librarry
    public Dbset<User> Users {set;get;}
    //“My database has a table called Users, and each row maps to a User object.”

    public Dbset<FileMetadata> FileMetadata {set;get;}
    //filematadata name is the same but inside <> is the table in the database in MODELS
    //folder otehr is just a name it can be  just filedata to

    //need to custom behavior cant use the inbuild in dbcontext so OVVERRIDE
    protected override void OnModelCreating(ModelBuilder modelBuilder){
        //OnModelCreating is a method in dbcontext this creates tables befor everything starts
        //ModelBuilder is the class modelBuilder (lowercase m) is teh variable name 

        modelBuilder.Entity<Users>()
            .HasIndex(u => u.Username)
            .IsUnique;

            //labda exp u => is ther for Like adding a table of contents or quick-access 
            // tab in a spreadsheet to jump straight to a row by username.

            modelBuilder.Entity<Users>()
                .HasIndex(u=> u.Email)
                .IsUnique();
    }
}