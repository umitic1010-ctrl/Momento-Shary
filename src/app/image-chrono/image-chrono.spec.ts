import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageChrono } from './image-chrono';

describe('ImageChrono', () => {
  let component: ImageChrono;
  let fixture: ComponentFixture<ImageChrono>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageChrono]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageChrono);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
