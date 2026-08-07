import { TestBed } from '@angular/core/testing';

import { ModuleUsersService } from './module-users.service';

describe('ModuleUsersService', () => {
  let service: ModuleUsersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModuleUsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
