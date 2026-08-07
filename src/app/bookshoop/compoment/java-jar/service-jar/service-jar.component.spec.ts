import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceJarComponent } from './service-jar.component';

describe('ServiceJarComponent', () => {
  let component: ServiceJarComponent;
  let fixture: ComponentFixture<ServiceJarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceJarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceJarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
