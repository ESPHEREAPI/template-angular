import { Permissions } from "./permissions";

export interface Roles {
    id?: number;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: Permissions[];
}
