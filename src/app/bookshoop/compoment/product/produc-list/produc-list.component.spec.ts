import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProducListComponent } from './produc-list.component';

describe('ProducListComponent', () => {
  let component: ProducListComponent;
  let fixture: ComponentFixture<ProducListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProducListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProducListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
