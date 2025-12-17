'use client';

import type { ChangeEvent } from 'react';
import type { OrderListQuery, OrderStatus } from '../domain/types';

const STATUSES: { label: string; value: OrderStatus | 'all' }[] = [
  { label: '全部', value: 'all' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已发货', value: 'shipped' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
  { label: '已退款', value: 'refunded' },
];

export function OrderFilterBar(props: {
  query: OrderListQuery;
  onChange: (patch: Partial<OrderListQuery>) => void;
  onReset: () => void;
}) {
  const { query, onChange, onReset } = props;

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        value={query.keyword ?? ''}
        placeholder="订单号 / 用户名"
        onChange={(e) => onChange({ keyword: e.target.value || undefined })}
        style={{ padding: '8px 10px', width: 240 }}
      />

      <select
        value={query.status ?? 'all'}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange({ status: e.target.value as OrderStatus | 'all' })}
        style={{ padding: '8px 10px' }}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>从</span>
        <input
          type="date"
          value={query.createdFrom ?? ''}
          onChange={(e) => onChange({ createdFrom: e.target.value || undefined })}
          style={{ padding: '8px 10px' }}
        />
      </label>

      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>到</span>
        <input
          type="date"
          value={query.createdTo ?? ''}
          onChange={(e) => onChange({ createdTo: e.target.value || undefined })}
          style={{ padding: '8px 10px' }}
        />
      </label>

      <button onClick={onReset} style={{ padding: '8px 12px' }}>
        重置
      </button>
    </div>
  );
}
