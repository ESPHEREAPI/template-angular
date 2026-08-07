import { TestBed } from '@angular/core/testing';

import { UsernameCacheService } from './username-cache.service';

describe('UsernameCacheService', () => {
  let service: UsernameCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsernameCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
