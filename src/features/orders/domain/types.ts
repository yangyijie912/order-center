export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export type Order = {
  id: string;
  userId: string;
  userName: string;
  phone?: string;

  amount: number;
  currency: 'CNY' | 'USD';

  status: OrderStatus;

  createdAt: string; // ISO
  updatedAt: string; // ISO

  itemsCount: number;
};

export type OrderListQuery = {
  page: number;
  pageSize: number;

  keyword?: string;
  status?: OrderStatus | 'all';

  createdFrom?: string; // YYYY-MM-DD
  createdTo?: string;   // YYYY-MM-DD

  minAmount?: number;
  maxAmount?: number;

  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
};

export type OrderListResponse = {
  list: Order[];
  total: number;
  page: number;
  pageSize: number;
};
