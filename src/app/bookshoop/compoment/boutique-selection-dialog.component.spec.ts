import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoutiqueSelectionDialogComponent } from './boutique-selection-dialog.component';

describe('BoutiqueSelectionDialogComponent', () => {
  let component: BoutiqueSelectionDialogComponent;
  let fixture: ComponentFixture<BoutiqueSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoutiqueSelectionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoutiqueSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
