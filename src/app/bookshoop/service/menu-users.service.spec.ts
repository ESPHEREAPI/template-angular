import { TestBed } from '@angular/core/testing';

import { MenuUsersService } from './menu-users.service';

describe('MenuUsersService', () => {
  let service: MenuUsersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuUsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
