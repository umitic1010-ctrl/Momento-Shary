import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class QrScanner {
  private detector: any;
  private scanningInterval: any;
  detectedQrCode = signal<string | null>(null);

  isBarcodeDetectorSupported(): boolean {
    return 'BarcodeDetector' in window;
  }

  async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    });
    videoElement.srcObject = stream;
    await videoElement.play();
    return stream;
  }

createDetector() {
    if (this.isBarcodeDetectorSupported()) {
      this.detector = new (window as any).BarcodeDetector({ 
        formats: ['qr_code'] 
      });
    }
  }

startScanning(videoElement: HTMLVideoElement) {
    this.scanningInterval = setInterval(async () => {
      if (this.detector && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await this.detector.detect(videoElement);
          if (barcodes.length > 0) {
            this.detectedQrCode.set(barcodes[0].rawValue);
          }
        } catch (error) {
          console.error('Scan-Fehler:', error);
        }
      }
    }, 100); // Alle 100ms scannen
  }

stopScanning(stream: MediaStream) {
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval);
      this.scanningInterval = null;
    }
    // Kamera stoppen
    stream.getTracks().forEach(track => track.stop());
  }
}