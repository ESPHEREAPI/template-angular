
import { ClientOrder } from "./client-order";
import { ItemProduct } from "./Item-Product";


export class Caddy {
    public name: string;
    //public items!: Map<number, ItemProduct>;
    public itemsProducts!: Array<ItemProduct>;
    public client!: ClientOrder;
    constructor(name: string) {
        this.name = name;

    }
}