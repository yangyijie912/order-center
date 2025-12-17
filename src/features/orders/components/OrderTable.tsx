'use client';

import type { Order } from '../domain/types';
import { canActionOnOrder } from '../domain/rules';
import { Button, Table } from 'beaver-ui';

/**
 * OrderTable
 * - 展示订单列表的表格组件
 *
 * Props:
 * - `orders`: 订单数组
 * - `loading`: 加载状态，占位显示
 * - `onView`: 点击查看详情时的回调，传入对应订单
 * - `onCancel`: 点击取消订单时的回调
 * - `onDelete`: 点击删除订单时的回调
 *
 * 组件不持有本地排序/分页状态，专注于渲染和对用户操作的回调。
 */
export function OrderTable(props: {
  orders: Order[];
  loading?: boolean;
  onView: (o: Order) => void;
  onCancel: (o: Order) => void;
  onDelete: (o: Order) => void;
  // 分页信息与回调（可选）
  pagination?:
    | { total: number; page: number; pageSize: number; onChange?: (page: number, pageSize?: number) => void }
    | false;
}) {
  const { orders, loading, onView, onCancel, onDelete, pagination } = props;

  // beaver-ui Table 的列定义
  type LocalColumn = {
    key: string;
    title: string;
    render: (value: unknown, row: unknown) => React.ReactNode;
    width?: string;
    align?: 'center' | 'left' | 'right';
  };

  const columns: LocalColumn[] = [
    { key: 'id', title: '订单号', render: (_value: unknown, row: unknown) => (row as Order).id },
    { key: 'user', title: '用户', render: (_value: unknown, row: unknown) => (row as Order).userName },
    {
      key: 'amount',
      title: '金额',
      render: (_value: unknown, row: unknown) =>
        `${(row as Order).currency} ${Number((row as Order).amount).toFixed(2)}`,
    },
    { key: 'status', title: '状态', render: (_value: unknown, row: unknown) => statusTag((row as Order).status) },
    {
      key: 'createdAt',
      title: '创建时间',
      render: (_value: unknown, row: unknown) => new Date((row as Order).createdAt).toLocaleString(),
    },
    {
      key: 'actions',
      title: '操作',
      width: '220px',
      align: 'center',
      render: (_value: unknown, row: unknown) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button onClick={() => onView(row as Order)} size="small" variant="link">
            详情
          </Button>
          <Button
            onClick={() => onCancel(row as Order)}
            size="small"
            variant="link"
            disabled={!canActionOnOrder(row as Order, 'CANCEL')}
          >
            取消
          </Button>
          <Button
            onClick={() => onDelete(row as Order)}
            size="small"
            variant="link"
            color="danger"
            disabled={!canActionOnOrder(row as Order, 'DELETE')}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  const data: Order[] = orders.map((o) => ({ ...o }));

  // 构造分页配置
  const tablePagination:
    | false
    | {
        total: number;
        current: number;
        pageSize: number;
        onChange?: (page: number, pageSize?: number) => void;
      } =
    pagination === false
      ? false
      : {
          total: pagination?.total ?? 0,
          current: pagination?.page ?? 1,
          pageSize: pagination?.pageSize ?? 10,
          onChange: pagination?.onChange,
        };

  return (
    <div>
      <Table
        columns={columns}
        data={data}
        rowKey={'id'}
        border
        pagination={tablePagination}
        emptyText={loading ? '加载中...' : '暂无数据'}
      />
    </div>
  );
}

// 将订单状态的枚举值映射为中文标签
function statusLabel(s: Order['status']) {
  switch (s) {
    case 'pending':
      return '待支付';
    case 'paid':
      return '已支付';
    case 'shipped':
      return '已发货';
    case 'completed':
      return '已完成';
    case 'cancelled':
      return '已取消';
    case 'refunded':
      return '已退款';
    default:
      return s;
  }
}

// 返回带颜色的状态标签
function statusTag(s: Order['status']) {
  const text = statusLabel(s);
  const styleMap: Record<string, React.CSSProperties> = {
    pending: { background: '#fff4e5', color: '#b36b00' },
    paid: { background: '#e6f7ff', color: '#096dd9' },
    shipped: { background: '#f0f5ff', color: '#2f54eb' },
    completed: { background: '#f6ffed', color: '#237804' },
    cancelled: { background: '#f5f5f5', color: '#8c8c8c' },
    refunded: { background: '#fff1f0', color: '#a8071a' },
  };

  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  };

  const style = { ...(styleMap[s] ?? { background: '#fafafa', color: '#222' }), ...base };

  return <span style={style}>{text}</span>;
}
