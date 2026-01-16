namespace MomentoShary.Backend.DTOs;

public record PdfUploadDto(string Title, string? Description);

public record PdfResponseDto(
    int Id,
    string Title,
    string? Description,
    DateTime UploadedAt,
    string Url
);

public record PdfListDto(
    int Id,
    string Title,
    string? Description,
    DateTime UploadedAt
);
