'use client';

import type { Order } from '../domain/types';
import { UI_ACTIONS, type UIActionKey } from '../ui/uiActions';
import { OrderEntity } from '../domain/order';
import type { OrderEvent } from '../domain/stateMachine';
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
    {
      key: 'status',
      title: '状态',
      render: (_value: unknown, row: unknown) => {
        const o = row as Order;
        const entity = new OrderEntity(o);
        const text = entity.statusLabel();
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
        const style = { ...(styleMap[entity.status] ?? { background: '#fafafa', color: '#222' }), ...base };
        return <span style={style}>{text}</span>;
      },
    },
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
            const entity = new OrderEntity(o);

            return Object.keys(UI_ACTIONS).map((key) => {
              const def = UI_ACTIONS[key as UIActionKey];
              const isEvent = !!def.eventType;
              let enabled = false;
              if (isEvent && def.eventType) enabled = entity.can(def.eventType as OrderEvent['type']);
              if (!isEvent) enabled = entity.canUIAction(key);
              const onClick = () => {
                if (key === 'VIEW_DETAIL') return onView(o);
                onAction(key as UIActionKey, o);
              };

              const btn = (
                <Button
                  key={key}
                  size="small"
                  variant="link"
                  color={key === 'DELETE' || key === 'REFUND' ? 'danger' : undefined}
                  disabled={!enabled}
                >
                  {def?.label ?? key}
                </Button>
              );

              if (def?.confirm) {
                return (
                  <Popconfirm
                    key={key}
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

              return (
                <span key={key}>
                  <Button
                    size="small"
                    variant="link"
                    color={key === 'DELETE' ? 'danger' : undefined}
                    disabled={!enabled}
                    onClick={onClick}
                  >
                    {def?.label ?? key}
                  </Button>
                </span>
              );
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
