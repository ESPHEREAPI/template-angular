export interface TableColumn {
    field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'string' | 'number' | 'date' ; // ou tout autre type pertinent
}

