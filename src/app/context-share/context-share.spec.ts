import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContextShare } from './context-share';

describe('ContextShare', () => {
  let component: ContextShare;
  let fixture: ComponentFixture<ContextShare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContextShare]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContextShare);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
