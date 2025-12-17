import type { Order } from '@/features/orders/domain/types';

declare global {
  var __ORDER_DB__: Order[] | undefined;
}

export {};
