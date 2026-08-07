export interface Supplier {
    id?: number;
    name: string;
    phone: string;
    contactName?: string;
    email: string;

    address?: string;
    paymentTerms?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
