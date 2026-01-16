// Import Angular core features for reactivity and dependency injection
import { Component, signal, input, computed, inject, viewChild, ElementRef, OnDestroy, ChangeDetectionStrategy, afterNextRender, Injector } from '@angular/core';
// Import FormsModule to enable two-way data binding with [(ngModel)]
import { FormsModule } from '@angular/forms';
// Import our custom types
import { PhotoItem } from '../photo-item';
import { PhotoService } from '../photo-service';

@Component({
  selector: 'app-photo-gallery',
  imports: [FormsModule], // Needed for [(ngModel)] in template
  templateUrl: './photo-gallery.html',
  styleUrl: './photo-gallery.css',
  changeDetection: ChangeDetectionStrategy.OnPush, // Performance: only check when signals change
})
export class PhotoGallery implements OnDestroy {
  // === DEPENDENCY INJECTION ===
  // Inject the PhotoService to access shared photo state across components
  protected readonly photoService = inject(PhotoService);
  
  // Inject the Injector to use with afterNextRender (required for async operations)
  private readonly injector = inject(Injector);
  
  // === VIEW CHILD QUERIES (Angular v19+ Signal API) ===
  // viewChild() returns a Signal<ElementRef | undefined>
  // Must call it like a function: videoElement() to get the value
  // 'videoElement' matches the #videoElement in template
  protected readonly videoElement = viewChild<ElementRef<HTMLVideoElement>>('videoElement');
  protected readonly canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvasElement');
  
  // === STATE MANAGEMENT (Signals) ===
  // Get the signal containing all selected photos from the service
  protected readonly selectedImages = this.photoService.getPhotos();
  
  // Signal to hold the current search term entered by the user
  protected readonly searchTerm = signal('');
  
  // Signal to track if camera is currently active
  protected readonly isCameraOpen = signal(false);
  
  // Store the MediaStream object to stop it later
  // This is NOT a signal because we don't need Angular to track changes
  private currentStream: MediaStream | null = null;
  
  // Computed signal: automatically filters photos based on search term
  // This re-runs whenever searchTerm or selectedImages changes
  protected readonly filteredImages = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.selectedImages().filter(photo => photo.name.toLowerCase().includes(term));
  });
 
  // Computed signal: counts the total number of selected photos
  protected readonly count = computed(() => this.selectedImages().length);
  
  // Computed signal: estimates total size (2MB per photo as placeholder)
  protected readonly calculateImageSize = computed(() => this.count() * 2);

  // === COMPONENT INPUTS ===
  // Input property: allows parent component to set a photo limit
  // Default is 10 if parent doesn't provide a value
  readonly maxPhotos = input<number>(10);

  // === EVENT HANDLERS ===
  /**
   * Handles file selection from the file input element
   * Creates temporary URLs for preview and adds photos to the service
   */
  protected async onFileSelect(event: Event): Promise<void> {
    // Cast the event target to HTMLInputElement to access files
    const input = event.target as HTMLInputElement;
    
    if (input.files) {
      console.log('Files selected:', input.files.length);
      
      // Create an array to hold PhotoItem objects
      const urls: PhotoItem[] = [];
      
      // Loop through each selected file and upload
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        
        // Create a temporary URL for preview (blob URL)
        urls.push({ 
          url: URL.createObjectURL(file), 
          name: file.name 
        });

        // Upload to backend
        try {
          const uploadPath = await this.photoService.uploadPhoto(file, file.name);
          console.log('✅ File uploaded:', file.name, 'to:', uploadPath);
        } catch (error) {
          console.error('❌ File upload failed:', file.name, error);
        }
      }
      
      console.log('URLs created:', urls.length);
      
      // Add all photos to the service at once
      this.photoService.addPhotos(urls);
    }
  }
  
  /**
   * Debug helper: logs all photos to the console
   * Useful for development and troubleshooting
   */
  protected debugPhotos(): void {
    console.log('All photos:', this.selectedImages());
  }

  // === CAMERA API METHODS ===
  
  /**
   * Opens the camera using MediaStream API
   * 
   * HOW IT WORKS:
   * 1. Request camera access with getUserMedia()
   * 2. Browser shows permission dialog
   * 3. If granted, we get a MediaStream object
   * 4. Attach stream to <video> element for live preview
   * 5. Update UI state (hide buttons, show camera)
   */
  protected async openCamera(): Promise<void> {
    try {
      // Check if browser supports the API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('❌ Your browser does not support camera access!');
        return;
      }

      // STEP 1: Open the modal FIRST so video element gets rendered
      // This triggers the @if condition and Angular creates the video element
      this.isCameraOpen.set(true);

      // STEP 2: Wait for next Angular render cycle using afterNextRender
      // This is the modern Angular way instead of setTimeout(0)
      // afterNextRender() ensures the DOM is fully updated before proceeding
      await new Promise<void>(resolve => {
        afterNextRender(() => {
          resolve();
        }, { injector: this.injector });
      });

      // STEP 3: Get the video element (should exist now!)
      const videoRef = this.videoElement();
      if (!videoRef) {
        console.error('❌ Video element not found in template');
        this.isCameraOpen.set(false); // Close modal on error
        return;
      }

      // STEP 4: Request camera access with configuration
      // This returns a Promise<MediaStream>
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1920 },    // Request 1920px width (ideal, not required)
          height: { ideal: 1080 }     // Request 1080px height
        }
      });

      // STEP 5: Store the stream so we can stop it later
      this.currentStream = stream;

      // STEP 6: Attach the stream to the video element
      // srcObject is the modern way (not 'src' attribute!)
      videoRef.nativeElement.srcObject = stream;

      // STEP 7: Start playing the video automatically
      // play() returns a Promise, so we await it
      await videoRef.nativeElement.play();

      console.log('✅ Camera opened successfully');
      console.log('📹 Video dimensions:', videoRef.nativeElement.videoWidth, 'x', videoRef.nativeElement.videoHeight);
    } catch (error) {
      // Error handling for different scenarios
      console.error('❌ Camera error:', error);
      
      // Close modal on any error
      this.isCameraOpen.set(false);
      
      if (error instanceof Error) {
        // User denied permission
        if (error.name === 'NotAllowedError') {
          alert('📷 Camera permission denied. Please allow camera access in browser settings.');
        }
        // Camera is already in use
        else if (error.name === 'NotReadableError') {
          alert('📷 Camera is already in use by another application.');
        }
        // No camera found
        else if (error.name === 'NotFoundError') {
          alert('📷 No camera found on this device.');
        }
        // Generic error
        else {
          alert(`❌ Camera error: ${error.message}`);
        }
      }
    }
  }

  /**
   * Captures a photo from the video stream
   * 
   * HOW IT WORKS:
   * 1. Get current video frame dimensions
   * 2. Set canvas to same size
   * 3. Draw current video frame onto canvas
   * 4. Convert canvas to Blob (binary image data)
   * 5. Convert Blob to File object
   * 6. Add to PhotoService like file input does
   * 7. Close camera
   */
  protected capturePhoto(): void {
    // Get the elements from signals
    const videoRef = this.videoElement();
    const canvasRef = this.canvasElement();

    if (!videoRef || !canvasRef) {
      console.error('❌ Video or canvas element not found');
      return;
    }

    const video = videoRef.nativeElement;
    const canvas = canvasRef.nativeElement;

    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Get 2D drawing context
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('❌ Could not get canvas context');
      return;
    }

    // Draw the current video frame onto the canvas
    // This "freezes" the current frame as an image
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to Blob (asynchronous)
    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('❌ Could not create blob from canvas');
        return;
      }

      // Automatische Kompression wenn > 1MB (SOLL-Kriterium!)
      let finalBlob = blob;
      if (blob.size > 1024 * 1024) { // > 1MB
        console.log(`📦 Bild zu groß (${(blob.size / 1024 / 1024).toFixed(2)}MB), komprimiere...`);
        finalBlob = await this.compressImage(canvas, blob.type);
        console.log(`✅ Komprimiert auf ${(finalBlob.size / 1024 / 1024).toFixed(2)}MB`);
      }

      // Convert Blob to File object
      // File extends Blob with name and lastModified properties
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const file = new File([finalBlob], `camera-${timestamp}.jpg`, { 
        type: 'image/jpeg' 
      });

      // Create PhotoItem with blob URL for preview
      const photoItem: PhotoItem = {
        url: URL.createObjectURL(finalBlob),
        name: file.name
      };

      // Add to service (same as file input)
      this.photoService.addPhotos([photoItem]);

      // Upload to backend
      try {
        const uploadPath = await this.photoService.uploadPhoto(finalBlob, file.name);
        console.log('✅ Photo uploaded to:', uploadPath);
      } catch (error) {
        console.error('❌ Photo upload failed:', error);
      }

      // Close the camera after capture
      this.closeCamera();
    }, 'image/jpeg', 0.95); // JPEG format, 95% quality
  }
  
  /**
   * Komprimiert ein Bild iterativ bis es unter 1MB ist
   * Erfüllt SOLL-Kriterium: "Automatische Bildkompression (unter 1MB)"
   */
  private async compressImage(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
    let quality = 0.9;
    let blob: Blob | null = null;
    
    // Schrittweise Qualität reduzieren bis < 1MB
    while (quality > 0.1) {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, type, quality);
      });
      
      if (blob && blob.size <= 1024 * 1024) {
        return blob;
      }
      
      quality -= 0.1;
    }
    
    // Fallback: Wenn immer noch zu groß, Bild verkleinern
    if (blob && blob.size > 1024 * 1024) {
      const scale = Math.sqrt((1024 * 1024) / blob.size);
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvas.width * scale;
      newCanvas.height = canvas.height * scale;
      
      const ctx = newCanvas.getContext('2d')!;
      ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
      
      blob = await new Promise<Blob | null>((resolve) => {
        newCanvas.toBlob(resolve, type, 0.9);
      });
    }
    
    return blob!;
  }

  /**
   * Closes the camera and stops all tracks
   * 
   * WHY THIS IS IMPORTANT:
   * - Releases camera hardware (LED turns off)
   * - Other apps can use camera again
   * - Saves battery
   * - Stops MediaStream tracks
   */
  protected closeCamera(): void {
    if (this.currentStream) {
      // Stop all tracks (video and audio if any)
      this.currentStream.getTracks().forEach(track => {
        track.stop(); // This turns off the camera LED
        console.log('🛑 Stopped track:', track.kind);
      });

      // Clear the stream reference
      this.currentStream = null;
    }

    // Reset video element if it exists
    const videoRef = this.videoElement();
    if (videoRef) {
      videoRef.nativeElement.srcObject = null;
    }

    // Update UI state
    this.isCameraOpen.set(false);

    console.log('✅ Camera closed');
  }

  /**
   * Lifecycle hook: Cleanup when component is destroyed
   * 
   * CRITICAL: Always stop camera when leaving the page!
   * Otherwise camera stays on and drains battery
   */
  ngOnDestroy(): void {
    this.closeCamera();
    console.log('🧹 Component destroyed, camera cleaned up');
  }
}
