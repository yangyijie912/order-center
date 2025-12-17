// 订单状态枚举（字符串字面量类型）
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded';

// 订单数据结构定义
export type Order = {
  id: string;
  userId: string;
  userName: string;
  phone?: string;

  amount: number;
  currency: 'CNY' | 'USD';

  status: OrderStatus;

  // ISO 格式时间字符串（例如：2023-01-01T12:00:00.000Z）
  createdAt: string;
  updatedAt: string;

  itemsCount: number;
};

// 列表查询参数类型：用于构建请求或解析 URL 查询参数
export type OrderListQuery = {
  page: number;
  pageSize: number;

  // 可选的关键字搜索（订单号 / 用户名）
  keyword?: string;
  // 状态支持具体状态或 'all' 表示不过滤
  status?: OrderStatus | 'all';

  // 创建时间范围，格式为 YYYY-MM-DD（直接和 date input 对接）
  createdFrom?: string;
  createdTo?: string;

  // 金额范围过滤
  minAmount?: number;
  maxAmount?: number;

  // 排序字段与顺序
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
};

// 列表接口返回的数据格式
export type OrderListResponse = {
  list: Order[];
  total: number;
  page: number;
  pageSize: number;
};
