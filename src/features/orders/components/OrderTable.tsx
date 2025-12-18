'use client';

import type { Order } from '../domain/types';
import { getAvailableUIActions, UI_ACTIONS, type UIActionKey, type OrderContext } from '../domain/stateMachine';
import { Button, Table, Popconfirm } from 'beaver-ui';

/**
 * OrderTable
 * - 展示订单列表的表格组件
 *
 * Props:
 * - `orders`: 订单数组
 * - `loading`: 加载状态，占位显示
 * - `selectedRowKeys`: 选中的行 key 数组（来自外部）
 * - `onSelectChange`: 选择变化回调
 * - `onView`: 点击查看详情时的回调，传入对应订单
 * - `onCancel`: 点击取消订单时的回调
 * - `onDelete`: 点击删除订单时的回调
 *
 * 组件不持有本地排序/分页状态，专注于渲染和对用户操作的回调。
 */
export function OrderTable(props: {
  orders: Order[];
  loading?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  onView: (o: Order) => void;
  onAction: (action: UIActionKey, o: Order) => void;
  // 分页信息与回调（可选）
  pagination?:
    | { total: number; page: number; pageSize: number; onChange?: (page: number, pageSize?: number) => void }
    | false;
}) {
  const { orders, loading, selectedKeys = [], onSelectionChange, onView, onAction, pagination } = props;

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
      width: '280px',
      align: 'center',
      render: (_value: unknown, row: unknown) => (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {(() => {
            const o = row as Order;
            const ctx: OrderContext = { order: { id: o.id, userId: o.userId, amount: o.amount, status: o.status } };
            const avail = getAvailableUIActions(o.status, ctx);

            return avail.map((a) => {
              const def = UI_ACTIONS[a.type as UIActionKey];
              const onClick = () => {
                if (a.type === 'VIEW_DETAIL') return onView(o);
                onAction(a.type as UIActionKey, o);
              };

              const btn = (
                <Button
                  key={a.type}
                  size="small"
                  variant="link"
                  color={a.type === 'DELETE' ? 'danger' : undefined}
                  disabled={!a.enabled}
                  onClick={onClick}
                >
                  {def?.label ?? a.type}
                </Button>
              );

              if (def?.confirm) {
                return (
                  <Popconfirm
                    key={a.type}
                    title={def.confirm.title}
                    description={def.confirm.description ?? `${def.label} ${(o as Order).id}?`}
                    onConfirm={onClick}
                    okText={def.confirm.okText}
                    cancelText={def.confirm.cancelText}
                  >
                    {btn}
                  </Popconfirm>
                );
              }

              return <span key={a.type}>{btn}</span>;
            });
          })()}
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
        showQuickJumper?: boolean;
        showSizeChanger?: boolean;
        pageSizeOptions?: number[];
        onShowSizeChange?: (current: number, size: number) => void;
      } =
    pagination === false
      ? false
      : {
          total: pagination?.total ?? 0,
          current: pagination?.page ?? 1,
          pageSize: pagination?.pageSize ?? 10,
          onChange: pagination?.onChange,
          // 显示快速跳转输入框
          showQuickJumper: true,
          // 允许切换每页数量
          showSizeChanger: true,
          // 可选的每页显示条数（数字类型）
          pageSizeOptions: [10, 20, 50, 100],
          // 当用户改变每页数量时，重置到第一页并触发外部回调
          onShowSizeChange: (_current: number, size: number) => {
            pagination?.onChange?.(1, size);
          },
        };

  return (
    <div>
      <Table
        columns={columns}
        data={data}
        rowKey={'id'}
        border
        showCheckbox
        selectedKeys={selectedKeys}
        onSelectionChange={onSelectionChange}
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
