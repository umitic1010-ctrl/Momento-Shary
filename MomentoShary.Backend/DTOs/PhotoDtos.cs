namespace MomentoShary.Backend.DTOs
{
    public class PhotoUploadResponseDto
    {
        public string FilePath { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }

    public class PhotoInfoDto
    {
        public string FileName { get; set; } = string.Empty;
        public string RelativePath { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public long SizeInBytes { get; set; }
    }
}
