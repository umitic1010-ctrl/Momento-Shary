import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoCounter } from './photo-counter';

describe('PhotoCounter', () => {
  let component: PhotoCounter;
  let fixture: ComponentFixture<PhotoCounter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoCounter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoCounter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
