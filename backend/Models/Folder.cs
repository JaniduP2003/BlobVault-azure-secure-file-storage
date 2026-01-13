namespace backend.Models;

public class Folder{
    public int Id { get; set; }
    public string Name { get; set; } = string. Empty;
    public int UserId { get; set; }
    public int?  ParentFolderId { get; set; }  // null = root folder
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string Color { get; set; } = "#3b82f6"; // Default blue color
    
    // Navigation properties
    public User?  User { get; set; }
    public Folder? ParentFolder { get; set; }
    public ICollection<Folder> SubFolders { get; set; } = new List<Folder>();
    public ICollection<FileMetadata> Files { get; set; } = new List<FileMetadata>();
}