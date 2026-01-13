//this is were the data is stored
//so need to use DbContext , DbSet<T> ,ModelBuilder so needs enettity framework
//inmort the models here and decleare the data 

using Microsoft.EntityFrameworkCore;
using backend.Models;

// namespace declaration.
namespace backend.Data;

//the class name is appdbcontext and it INHARITES form DbContext
public class AppDbContext:DbContext{
    //above made the appdbcotext now lets add the setting inside 
    public AppDbContext(DbContextOptions<AppDbContext> options ): base(options) {}

    //{ get; set; } = Read/Write Access
    // ther is two shelfs of users and metadata in the DB librarry
    public DbSet<User> Users {set;get;}
    //“My database has a table called Users, and each row maps to a User object.”

    public DbSet<FileMetadata> FileMetadata {set;get;}
    //filematadata name is the same but inside <> is the table in the database in MODELS
    //folder otehr is just a name it can be  just filedata to

    public DbSet<Folder> Folders {set;get;}
    //Folders table for organizing files

    //need to custom behavior cant use the inbuild in dbcontext so OVVERRIDE
    protected override void OnModelCreating(ModelBuilder modelBuilder){
        //OnModelCreating is a method in dbcontext this creates tables befor everything starts
        //ModelBuilder is the class modelBuilder (lowercase m) is teh variable name 

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

            //labda exp u => is ther for Like adding a table of contents or quick-access 
            // tab in a spreadsheet to jump straight to a row by username.

            modelBuilder.Entity<User>()
                .HasIndex(u=> u.Email)
                .IsUnique();

            // Add index for storage queries for better speed 
            modelBuilder.Entity<FileMetadata>()
                .HasIndex(f => new { f.UserId, f. IsDeleted });


        modelBuilder.Entity<FileMetadata>()
            .HasIndex(f => f.FolderId);  // for faster folder queries

        // Folder indexes
        modelBuilder.Entity<Folder>()
            .HasIndex(f => new { f.UserId, f. ParentFolderId });  

        // Folder relationships
        //“Folders belong to users. If the user is deleted → all their folders die too.”
        modelBuilder.Entity<Folder>()
            .HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior. Cascade);

        //“Folders can have subfolders. But you’re NOT allowed to delete a parent if kids exist.”
        //Nope 🚫 Clean up the children first.”
        modelBuilder.Entity<Folder>()
            .HasOne(f => f.ParentFolder)
            .WithMany(f => f.SubFolders)
            .HasForeignKey(f => f.ParentFolderId)
            .OnDelete(DeleteBehavior.Restrict);  

        // File-Folder relationship
        //“Files can live inside folders… but if a folder dies, files become homeless — not dead.
        modelBuilder.Entity<FileMetadata>()
            .HasOne(f => f.Folder)
            .WithMany(folder => folder.Files)
            .HasForeignKey(f => f.FolderId)
            .OnDelete(DeleteBehavior. SetNull); 
    }
}