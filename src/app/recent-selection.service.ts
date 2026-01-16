import { Injectable, signal, computed } from '@angular/core';

interface RecentItem {
  spot: string;
  job: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecentSelectionService {
  private readonly STORAGE_KEY = 'momento_recent_selections';
  private readonly MAX_RECENT = 5;
  
  readonly recentItems = signal<RecentItem[]>(this.loadFromStorage());
  
  readonly recentSpots = computed(() => {
    const spots = new Set<string>();
    this.recentItems().forEach(item => spots.add(item.spot));
    return Array.from(spots).slice(0, 5);
  });
  
  readonly recentJobs = computed(() => {
    const jobs = new Map<string, string[]>();
    this.recentItems().forEach(item => {
      if (!jobs.has(item.spot)) {
        jobs.set(item.spot, []);
      }
      if (!jobs.get(item.spot)!.includes(item.job)) {
        jobs.get(item.spot)!.push(item.job);
      }
    });
    return jobs;
  });
  
  addSelection(spot: string, job: string): void {
    const newItem: RecentItem = {
      spot,
      job,
      timestamp: Date.now()
    };
    
    // Remove duplicates and add new item at start
    const filtered = this.recentItems().filter(
      item => !(item.spot === spot && item.job === job)
    );
    
    const updated = [newItem, ...filtered].slice(0, this.MAX_RECENT);
    this.recentItems.set(updated);
    this.saveToStorage(updated);
  }
  
  getRecentJobsForSpot(spot: string): string[] {
    return this.recentItems()
      .filter(item => item.spot === spot)
      .map(item => item.job)
      .filter((job, index, self) => self.indexOf(job) === index)
      .slice(0, 3);
  }
  
  private loadFromStorage(): RecentItem[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
  
  private saveToStorage(items: RecentItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save recent selections:', error);
    }
  }
  
  clear(): void {
    this.recentItems.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
