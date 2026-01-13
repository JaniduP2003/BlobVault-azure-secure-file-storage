public class CreateFolderRequest
{
    public string Name { get; set; } = string.Empty;
    public int? ParentFolderId { get; set; }
    public string?  Color { get; set; }
}
