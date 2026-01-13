namespace backend.Models
{
    public class BlobFileInfo
    {
        public required string Name { get; set; }
        public long Size { get; set; }
        public DateTimeOffset? LastModified { get; set; }
        public required string ContentType { get; set; }
    }
}
