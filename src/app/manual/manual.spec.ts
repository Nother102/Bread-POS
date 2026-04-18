import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Manual } from './manual';

describe('Manual', () => {
  let component: Manual;
  let fixture: ComponentFixture<Manual>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Manual]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Manual);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
