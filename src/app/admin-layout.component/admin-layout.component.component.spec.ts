import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLayoutComponentComponent } from './admin-layout.component.component';

describe('AdminLayoutComponentComponent', () => {
  let component: AdminLayoutComponentComponent;
  let fixture: ComponentFixture<AdminLayoutComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
