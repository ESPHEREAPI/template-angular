export interface Permissions {
    id: number;
    code: string;
    name: string;
    description: string;
    module: string;
    createdAt?: Date;
    updatedAt?: Date;
}
