import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListesArticlesComponent } from './listes-articles.component';

describe('ListesArticlesComponent', () => {
  let component: ListesArticlesComponent;
  let fixture: ComponentFixture<ListesArticlesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListesArticlesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListesArticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
