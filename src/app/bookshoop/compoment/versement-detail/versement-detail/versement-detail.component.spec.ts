import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VersementDetailComponent } from './versement-detail.component';

describe('VersementDetailComponent', () => {
  let component: VersementDetailComponent;
  let fixture: ComponentFixture<VersementDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersementDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VersementDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
