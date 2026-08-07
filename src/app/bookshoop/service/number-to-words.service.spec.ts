import { TestBed } from '@angular/core/testing';

import { NumberToWordsService } from './number-to-words.service';

describe('NumberToWordsService', () => {
  let service: NumberToWordsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NumberToWordsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
