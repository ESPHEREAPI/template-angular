import { TestBed } from '@angular/core/testing';

import { PrixArticlesService } from './prix-articles.service';

describe('PrixArticlesService', () => {
  let service: PrixArticlesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrixArticlesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
