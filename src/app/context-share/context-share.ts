import { Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PhotoService } from '../photo-service';
import { PhotoGallery } from '../photo-gallery/photo-gallery';
import { RecentSelectionService } from '../recent-selection.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-context-share',
  imports: [ReactiveFormsModule, PhotoGallery, CommonModule],
  templateUrl: './context-share.html',
  styleUrl: './context-share.css',
})
export class ContextShare {
  // === DEPENDENCY INJECTION ===
  private readonly fb = inject(FormBuilder);
  protected readonly photoService = inject(PhotoService);
  protected readonly recentService = inject(RecentSelectionService);
  
  // === SEARCH FUNCTIONALITY (SOLL-Kriterium!) ===
  protected readonly searchTerm = signal<string>('');
  
  // === DATA STRUCTURE (Spot -> Jobs mapping) ===
  private readonly allSpots = [
    'Production Hall A',
    'Warehouse',
    'Quality Control Station'
  ];
  
  protected readonly spotJobMap: Record<string, string[]> = {
    'Production Hall A': ['Assembly Line 1', 'Assembly Line 2', 'Quality Check'],
    'Warehouse': ['Receiving', 'Packaging', 'Shipping'],
    'Quality Control Station': ['Final Inspection', 'Testing', 'Calibration']
  };
  
  // Computed: Gefilterte Spots basierend auf Suchterm
  protected readonly filteredSpots = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allSpots;
    return this.allSpots.filter(spot => spot.toLowerCase().includes(term));
  });
  
  // === FORM DEFINITION ===
  protected readonly contextForm: FormGroup = this.fb.group({
    spot: ['', Validators.required],
    job: ['', Validators.required],
    comments: ['']
  });
  
  // === CONSTRUCTOR (Setup form behavior) ===
  constructor() {
    // Listen for spot changes and reset job when it changes
    this.contextForm.get('spot')!.valueChanges.subscribe(() => {
      this.contextForm.get('job')!.setValue('');
    });
  }
  
  // === METHODS ===
  /**
   * Returns available jobs for the currently selected spot
   * Called by the template to populate job dropdown
   */
  protected getJobsForSpot(): string[] {
    const selectedSpot = this.contextForm.get('spot')?.value;
    if (!selectedSpot) return [];
    return this.spotJobMap[selectedSpot] || [];
  }
  
  /**
   * Schnellauswahl: Setzt Spot und Job aus Recent-Liste
   */
  protected selectRecent(spot: string, job: string): void {
    this.contextForm.patchValue({ spot, job });
  }
  
  /**
   * Form submission handler
   */
  protected async onSubmit(): Promise<void> {
    const formData = this.contextForm.value;
    const photos = this.photoService.getPhotos()();
    
    if (photos.length === 0) {
      alert('Keine Fotos zum Speichern!');
      return;
    }
    
    // Build folder path using PhotoService method with context
    const folderPath = this.photoService.getUserPhotoPath(formData.spot, formData.job);
    
    console.log('=== SAVE WITH CONTEXT ===');
    console.log('Folder Path:', folderPath);
    console.log('Spot:', formData.spot);
    console.log('Job:', formData.job);
    console.log('Comments:', formData.comments);
    console.log('Photos:', photos);
    
    // Upload all photos with context
    try {
      const context = {
        spot: formData.spot,
        job: formData.job,
        comments: formData.comments || ''
      };
      
      for (const photo of photos) {
        // Convert blob URL back to blob
        const response = await fetch(photo.url);
        const blob = await response.blob();
        
        await this.photoService.uploadPhoto(blob, photo.name, context);
        console.log(' Uploaded with context:', photo.name);
      }
            // Save to recent selections
      this.recentService.addSelection(formData.spot, formData.job);
            alert(` ${photos.length} Foto(s) erfolgreich gespeichert!\n\n Pfad: ${folderPath}`);
      
      // Clear form and photos
      this.contextForm.reset();
      this.photoService.getPhotos().set([]);
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Fehler beim Speichern der Fotos!');
    }
  }
}
