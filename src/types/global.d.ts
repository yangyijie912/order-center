import type { Order } from '@/features/orders/domain/types';

// 全局类型声明：用于在开发环境中挂载内存中的订单数据库（模拟）
declare global {
  var __ORDER_DB__: Order[] | undefined;
}

export {};
