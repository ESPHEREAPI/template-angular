import { Roles } from "./roles";

export interface User {
    id?: number;
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  profileImageUrl: string;
  roleId: number;
  role?: Roles;
  messageEcheck: string;
  echeck_connection: boolean ;

}
