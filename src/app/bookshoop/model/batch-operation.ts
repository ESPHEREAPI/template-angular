/**
 * Type pour les actions en lot
 */
export type BatchAction = 'export' | 'update_prices' | 'adjust_stock' | 'delete' | 'activate' | 'deactivate';

/**
 * Interface pour les actions en lot
 */
export interface BatchOperation {
  action: BatchAction;
  itemIds: number[];
  parameters?: Record<string, any>;
}