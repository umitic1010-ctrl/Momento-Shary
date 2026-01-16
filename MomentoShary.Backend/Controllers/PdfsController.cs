using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MomentoShary.Backend.Data;
using MomentoShary.Backend.DTOs;
using MomentoShary.Backend.Models;
using MomentoShary.Backend.Services;

namespace MomentoShary.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PdfsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPhotoStorageService _storageService;

    public PdfsController(AppDbContext context, IPhotoStorageService storageService)
    {
        _context = context;
        _storageService = storageService;
    }

    // GET: api/pdfs - Liste aller PDFs
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PdfListDto>>> GetPdfs()
    {
        var pdfs = await _context.PdfDocuments
            .OrderByDescending(p => p.UploadedAt)
            .Select(p => new PdfListDto(
                p.Id,
                p.Title,
                p.Description,
                p.UploadedAt
            ))
            .ToListAsync();

        return Ok(pdfs);
    }

    // GET: api/pdfs/5 - Hole PDF-Info
    [HttpGet("{id}")]
    public async Task<ActionResult<PdfResponseDto>> GetPdf(int id)
    {
        var pdf = await _context.PdfDocuments.FindAsync(id);

        if (pdf == null)
            return NotFound(new { message = "PDF nicht gefunden" });

        var url = $"{Request.Scheme}://{Request.Host}/api/pdfs/{id}/file";

        return Ok(new PdfResponseDto(
            pdf.Id,
            pdf.Title,
            pdf.Description,
            pdf.UploadedAt,
            url
        ));
    }

    // GET: api/pdfs/5/file - Download PDF-Datei
    [HttpGet("{id}/file")]
    public async Task<IActionResult> GetPdfFile(int id)
    {
        var pdf = await _context.PdfDocuments.FindAsync(id);

        if (pdf == null)
            return NotFound();

        var filePath = Path.Combine("uploads", "pdfs", pdf.FilePath);

        if (!System.IO.File.Exists(filePath))
            return NotFound(new { message = $"PDF-Datei nicht gefunden: {filePath}" });

        var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
        
        // Wichtige Header für PDF-Anzeige in iframe/PDF-Viewer
        Response.Headers.ContentDisposition = $"inline; filename=\"{Uri.EscapeDataString(pdf.FilePath)}\"";
        Response.Headers["Cross-Origin-Embedder-Policy"] = "require-corp";
        Response.Headers["Cross-Origin-Resource-Policy"] = "cross-origin";
        
        return File(fileBytes, "application/pdf");
    }

    // POST: api/pdfs - Upload PDF
    [HttpPost]
    public async Task<ActionResult<PdfResponseDto>> UploadPdf(
        [FromForm] string title,
        [FromForm] string? description,
        [FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Keine Datei hochgeladen" });

        if (!file.ContentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Nur PDF-Dateien erlaubt" });

        // Speichere PDF
        var uploadsFolder = Path.Combine("uploads", "pdfs");
        Directory.CreateDirectory(uploadsFolder);

        var fileName = $"{Guid.NewGuid()}.pdf";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Speichere in DB
        var pdfDocument = new PdfDocument
        {
            Title = title,
            Description = description,
            FilePath = fileName,
            UserId = 1 // TODO: Aus Auth-Token holen
        };

        _context.PdfDocuments.Add(pdfDocument);
        await _context.SaveChangesAsync();

        var url = $"{Request.Scheme}://{Request.Host}/api/pdfs/{pdfDocument.Id}/file";

        return CreatedAtAction(
            nameof(GetPdf),
            new { id = pdfDocument.Id },
            new PdfResponseDto(
                pdfDocument.Id,
                pdfDocument.Title,
                pdfDocument.Description,
                pdfDocument.UploadedAt,
                url
            )
        );
    }

    // DELETE: api/pdfs/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePdf(int id)
    {
        var pdf = await _context.PdfDocuments.FindAsync(id);

        if (pdf == null)
            return NotFound();

        // Lösche Datei
        var filePath = Path.Combine("uploads", "pdfs", pdf.FilePath);
        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);

        // Lösche DB-Eintrag
        _context.PdfDocuments.Remove(pdf);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
