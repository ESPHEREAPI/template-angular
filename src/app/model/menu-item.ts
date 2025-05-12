export interface MenuItem {
    label: string;
    icon: string;
    route?: string;
    permissions?: string[];
    children?: MenuItem[];
    expanded?: boolean;
}
