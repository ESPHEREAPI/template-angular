import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportClientComponent } from './rapport-client.component';

describe('RapportClientComponent', () => {
  let component: RapportClientComponent;
  let fixture: ComponentFixture<RapportClientComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportClientComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RapportClientComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
