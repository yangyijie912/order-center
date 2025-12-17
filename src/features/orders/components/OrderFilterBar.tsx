'use client';

import type { ChangeEvent } from 'react';
import type { OrderListQuery, OrderStatus } from '../domain/types';

// 组件用到的订单状态选项列表
// - label: 展示给用户看的文本
// - value: 与后端或查询模型一致的状态值，支持特殊值 'all' 表示不过滤状态
const STATUSES: { label: string; value: OrderStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
  { label: '已退款', value: 'refunded' },
];

/**
 * OrderFilterBar
 * - 订单列表的筛选栏组件，提供关键字、状态、起始/结束日期等筛选条件
 *
 * Props:
 * - `query`: 当前的筛选查询对象（`OrderListQuery`），用于将当前筛选值回填到表单控件
 * - `onChange`: 当筛选条件发生改变时触发，接受一个 `Partial<OrderListQuery>` 补丁对象
 * - `onReset`: 重置筛选器到初始状态的回调
 *
 * 注意：该组件使用受控组件模式（由外层传入 `query` 并通过 `onChange` 更新），
 * 因此组件本身不持有本地状态，所有变更都通过 `onChange` 向上通知。
 */
export function OrderFilterBar(props: {
  query: OrderListQuery;
  onChange: (patch: Partial<OrderListQuery>) => void;
  onReset: () => void;
}) {
  const { query, onChange, onReset } = props;

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* 关键字输入：搜索订单号或用户名 */}
      <input
        value={query.keyword ?? ''}
        placeholder="订单号 / 用户名"
        // 当输入为空字符串时，向上传递 `undefined` 表示清除该筛选项
        onChange={(e) => onChange({ keyword: e.target.value || undefined })}
        style={{ padding: '8px 10px', width: 240 }}
      />

      {/* 状态下拉：从 STATUSES 中渲染选项 */}
      <select
        value={query.status ?? 'all'}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          // 强制转换为 `OrderStatus | 'all'`，因为 select 返回 string
          onChange({ status: e.target.value as OrderStatus | 'all' })
        }
        style={{ padding: '8px 10px' }}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* 起始日期：使用 date input，value 为空时回传 undefined */}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>从</span>
        <input
          type="date"
          value={query.createdFrom ?? ''}
          onChange={(e) => onChange({ createdFrom: e.target.value || undefined })}
          style={{ padding: '8px 10px' }}
        />
      </label>

      {/* 结束日期：使用 date input，value 为空时回传 undefined */}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>到</span>
        <input
          type="date"
          value={query.createdTo ?? ''}
          onChange={(e) => onChange({ createdTo: e.target.value || undefined })}
          style={{ padding: '8px 10px' }}
        />
      </label>

      {/* 重置按钮：触发父组件传入的 `onReset` 回调 */}
      <button onClick={onReset} style={{ padding: '8px 12px' }}>
        重置
      </button>
    </div>
  );
}
