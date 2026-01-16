import { Component, viewChild, signal, inject, ElementRef, effect } from '@angular/core';
import { Router } from '@angular/router';
import { QrScanner } from '../qr-scanner.service';
import { Pdf } from '../pdf';

@Component({
  selector: 'app-qr-scanner',
  imports: [],
  templateUrl: './qr-scanner.html',
  styleUrl: './qr-scanner.css',
})
export class QrScannerComponent {
  private readonly qrScanner = inject(QrScanner);
  private readonly router = inject(Router);
  private readonly pdfService = inject(Pdf);
  
  videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');
  
  qrCode = this.qrScanner.detectedQrCode;
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  private currentStream: MediaStream | null = null;

  constructor() {
    // Effect: Reagiert automatisch auf gescannten QR-Code
    effect(() => {
      const code = this.qrCode();
      if (code) {
        this.handleQrCode(code);
      }
    });
  }

  async onStart() {
    if (!this.qrScanner.isBarcodeDetectorSupported()) {
      this.errorMessage.set('Dein Browser unterstützt keinen QR-Scan!');
      return;
    }

    const videoEl = this.videoElement()?.nativeElement;
    if (!videoEl) return;

    try {
      this.qrScanner.createDetector();
      this.currentStream = await this.qrScanner.startCamera(videoEl);
      this.qrScanner.startScanning(videoEl);
      this.errorMessage.set(null);
      this.successMessage.set(null);
    } catch (error) {
      this.errorMessage.set('Kamera-Zugriff verweigert!');
    }
  }

  onStop() {
    if (this.currentStream) {
      this.qrScanner.stopScanning(this.currentStream);
      this.currentStream = null;
    }
  }

  private handleQrCode(code: string): void {
    // Format: "pdf:1" oder "pdf:2" für PDF mit ID
    if (code.startsWith('pdf:')) {
      const pdfId = parseInt(code.substring(4), 10);
      
      if (isNaN(pdfId)) {
        this.errorMessage.set('Ungültiger PDF-QR-Code!');
        return;
      }

      // Prüfe ob PDF existiert
      this.pdfService.getPdf(pdfId).subscribe({
        next: (pdf) => {
          this.successMessage.set(`✅ PDF gefunden: ${pdf.title}`);
          
          // Stoppe Scan und öffne PDF
          this.onStop();
          
          // Warte kurz, dann navigiere zu PDFs und öffne
          setTimeout(() => {
            this.router.navigate(['/pdfs']).then(() => {
              // Trigger PDF-Öffnung via Service
              this.pdfService.openPdfById(pdfId);
            });
          }, 1000);
        },
        error: () => {
          this.errorMessage.set(`PDF mit ID ${pdfId} nicht gefunden!`);
        }
      });
    } else {
      // Anderer QR-Code Format
      this.successMessage.set(`QR-Code: ${code}`);
    }
  }
}
