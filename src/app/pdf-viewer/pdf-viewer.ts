import { Component, inject, signal, OnInit, ChangeDetectionStrategy, effect } from '@angular/core';
import { Pdf, PdfDocument } from '../pdf';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-pdf-viewer',
  imports: [DatePipe],
  templateUrl: './pdf-viewer.html',
  styleUrl: './pdf-viewer.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PdfViewerComponent implements OnInit {
  private readonly pdfService = inject(Pdf);
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly pdfs = signal<PdfDocument[]>([]);
  protected readonly selectedPdfUrl = signal<SafeResourceUrl | null>(null);
  protected readonly selectedPdfTitle = signal<string>('');
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  
  private isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  constructor() {
    // Effect: Reagiert auf pdfToOpen Signal vom QR-Scanner
    effect(() => {
      const pdfId = this.pdfService.pdfToOpen();
      const currentPdfs = this.pdfs();
      
      // Nur wenn pdfId gesetzt ist UND PDFs geladen sind
      if (pdfId !== null && currentPdfs.length > 0) {
        const pdf = currentPdfs.find(p => p.id === pdfId);
        if (pdf) {
          console.log('📄 Öffne PDF via QR-Code:', pdf.title);
          this.openPdf(pdf);
        } else {
          console.warn('⚠️ PDF mit ID', pdfId, 'nicht gefunden in Liste');
        }
        // Reset Signal nach Verarbeitung
        this.pdfService.pdfToOpen.set(null);
      }
    });
  }

  ngOnInit(): void {
    this.loadPdfs();
  }

  loadPdfs(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.pdfService.getPdfs().subscribe({
      next: (pdfs) => {
        this.pdfs.set(pdfs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Fehler beim Laden der PDFs');
        this.loading.set(false);
        console.error('PDF-Liste Fehler:', err);
      }
    });
  }

  openPdf(pdf: PdfDocument): void {
    const url = this.pdfService.getPdfFileUrl(pdf.id);
    
    // Mobile: Öffne in neuem Tab (native PDF Viewer)
    if (this.isMobile) {
      window.open(url, '_blank');
      return;
    }
    
    // Desktop: Zeige in iframe
    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.selectedPdfUrl.set(safeUrl);
    this.selectedPdfTitle.set(pdf.title);
  }

  closePdf(): void {
    this.selectedPdfUrl.set(null);
    this.selectedPdfTitle.set('');
  }
}
