import { TestBed } from '@angular/core/testing';

import { BonAchatService } from './bon-achat.service';

describe('BonAchatService', () => {
  let service: BonAchatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BonAchatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
