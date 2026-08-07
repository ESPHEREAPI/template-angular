import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VersementFormComponent } from './versement-form.component';

describe('VersementFormComponent', () => {
  let component: VersementFormComponent;
  let fixture: ComponentFixture<VersementFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersementFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VersementFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
