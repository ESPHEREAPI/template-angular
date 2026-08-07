export interface TableColumnStaticStock {
     key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'badge' | 'action';
  sortable: boolean;
  filterable: boolean;
  visible: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}
