import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkplaceHierarchy } from './workplace-hierarchy';

describe('WorkplaceHierarchy', () => {
  let component: WorkplaceHierarchy;
  let fixture: ComponentFixture<WorkplaceHierarchy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkplaceHierarchy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkplaceHierarchy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
