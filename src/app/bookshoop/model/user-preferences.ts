import { DisplayConfig } from "./display-config";
import { StockFilter } from "./stock-filter";

export interface UserPreferences {
    pageSize: number;
  displayConfig: DisplayConfig;
  filtresParDefaut?: Partial<StockFilter>;
  colonnesVisibles: string[];
  ordreColonnes: string[];
}
