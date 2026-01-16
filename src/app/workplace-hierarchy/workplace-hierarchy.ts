import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface WorkplaceSpot {
  name: string;
  jobs: string[];
  expanded: boolean;
}

@Component({
  selector: 'app-workplace-hierarchy',
  imports: [CommonModule],
  templateUrl: './workplace-hierarchy.html',
  styleUrl: './workplace-hierarchy.css',
})
export class WorkplaceHierarchy {
  protected readonly workplaces = signal<WorkplaceSpot[]>([
    {
      name: 'Production Hall A',
      jobs: ['Assembly Line 1', 'Assembly Line 2', 'Quality Check'],
      expanded: false
    },
    {
      name: 'Warehouse',
      jobs: ['Receiving', 'Packaging', 'Shipping'],
      expanded: false
    },
    {
      name: 'Quality Control Station',
      jobs: ['Final Inspection', 'Testing', 'Calibration'],
      expanded: false
    }
  ]);

  toggleSpot(index: number) {
    this.workplaces.update(spots => {
      const updated = [...spots];
      updated[index] = { ...updated[index], expanded: !updated[index].expanded };
      return updated;
    });
  }

  expandAll() {
    this.workplaces.update(spots => 
      spots.map(spot => ({ ...spot, expanded: true }))
    );
  }

  collapseAll() {
    this.workplaces.update(spots => 
      spots.map(spot => ({ ...spot, expanded: false }))
    );
  }
}
