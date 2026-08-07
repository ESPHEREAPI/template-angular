export interface StockUpdateRequest {
     productId: number;
  quantity: number;
  type: 'SALE' | 'PURCHASE' | 'ADJUSTMENT';
  reason?: string;
}
