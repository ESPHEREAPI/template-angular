import { User } from "./user";


export interface UserSession {
    usersDTO: User;
    token: string;
    permissions: string[];
    expiresAt: Date;
}
