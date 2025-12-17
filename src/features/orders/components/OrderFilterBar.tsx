'use client';

import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { KeyboardEvent } from 'react';
import type { OrderListQuery, OrderStatus } from '../domain/types';
import { Input, Select, DatePicker, Button } from 'beaver-ui';

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

// 将 STATUSES 转成 beaver-ui Select 需要的 options
const STATUS_OPTIONS = STATUSES.map((s) => ({ label: s.label, value: String(s.value) }));

function parseDateString(v?: string) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateToYMD(d?: Date | null) {
  if (!d) return undefined;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

  // 本地 keyword 状态，避免每次按键就触发上层路由更新（造成输入丢失/卡顿）
  const [localKeyword, setLocalKeyword] = useState<string>(query.keyword ?? '');

  // 当外部 query 发生变化（例如通过历史/重置）时同步本地输入
  useEffect(() => setLocalKeyword(query.keyword ?? ''), [query.keyword]);

  // 使用通用的防抖钩子，300ms 延迟
  const debouncedKeyword = useDebouncedValue(localKeyword, 300);

  useEffect(() => {
    const next = debouncedKeyword || undefined;
    if (next !== query.keyword) onChange({ keyword: next });
  }, [debouncedKeyword, onChange, query.keyword]);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* 关键字输入：搜索订单号或用户名 */}
      <Input
        value={localKeyword}
        placeholder="订单号 / 用户名"
        onChange={(e) => setLocalKeyword((e.target as HTMLInputElement).value)}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Enter') onChange({ keyword: localKeyword || undefined });
        }}
        width={'240px'}
      />

      {/* 状态下拉：从 STATUSES 中渲染选项 */}
      <Select
        options={STATUS_OPTIONS}
        value={String(query.status ?? 'all')}
        onChange={(v) => onChange({ status: (v as string) === 'all' ? 'all' : (v as OrderStatus) })}
        width={'160px'}
      />

      {/* 起始日期：使用 date input，value 为空时回传 undefined */}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>从</span>
        <DatePicker
          picker="date"
          value={parseDateString(query.createdFrom)}
          onChange={(d) => onChange({ createdFrom: formatDateToYMD(d) })}
          width={'160px'}
        />
      </label>

      {/* 结束日期：使用 date input，value 为空时回传 undefined */}
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>到</span>
        <DatePicker
          picker="date"
          value={parseDateString(query.createdTo)}
          onChange={(d) => onChange({ createdTo: formatDateToYMD(d) })}
          width={'160px'}
        />
      </label>

      {/* 重置按钮：触发父组件传入的 `onReset` 回调 */}
      <Button onClick={onReset} variant="ghost" size="medium">
        重置
      </Button>
    </div>
  );
}
