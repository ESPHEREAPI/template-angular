import { User } from "../bookshoop/model/user";



export interface UserSession {
    usersDTO: User;
    token: string;
    permissions: string[];
    expiresAt: Date;
     anneeid?:number;
    hasAuditAccess?: boolean;
    mustChangePassword?: boolean;
}
