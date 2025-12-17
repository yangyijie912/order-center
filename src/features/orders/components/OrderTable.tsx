'use client';

import type { Order } from '../domain/types';
import { canActionOnOrder } from '../domain/rules';

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
}) {
  const { orders, loading, onView, onCancel, onDelete } = props;

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb' }}>
            <th style={th}>订单号</th>
            <th style={th}>用户</th>
            <th style={th}>金额</th>
            <th style={th}>状态</th>
            <th style={th}>创建时间</th>
            <th style={th}>操作</th>
          </tr>
        </thead>
        <tbody>
          {/* 根据加载与数据状态渲染不同占位或数据行 */}
          {loading ? (
            <tr>
              <td style={td} colSpan={6}>
                加载中...
              </td>
            </tr>
          ) : orders.length === 0 ? (
            <tr>
              <td style={td} colSpan={6}>
                暂无数据
              </td>
            </tr>
          ) : (
            orders.map((o) => (
              <tr key={o.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={td}>{o.id}</td>
                <td style={td}>{o.userName}</td>
                <td style={td}>
                  {o.currency} {o.amount.toFixed(2)}
                </td>
                <td style={td}>{statusLabel(o.status)}</td>
                <td style={td}>{new Date(o.createdAt).toLocaleString()}</td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* 详情按钮 */}
                    <button onClick={() => onView(o)} style={btn}>
                      详情
                    </button>
                    {/* 取消/删除按钮使用 domain/rules 中的权限判断，决定是否可交互 */}
                    <button
                      onClick={() => onCancel(o)}
                      style={btn}
                      disabled={!canActionOnOrder(o, 'CANCEL')}
                      title={!canActionOnOrder(o, 'CANCEL') ? '该状态不可取消' : ''}
                    >
                      取消
                    </button>
                    <button
                      onClick={() => onDelete(o)}
                      style={btn}
                      disabled={!canActionOnOrder(o, 'DELETE')}
                      title={!canActionOnOrder(o, 'DELETE') ? '该状态不可删除' : ''}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// 表格样式（列头、列数据、按钮）
const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontWeight: 600, fontSize: 13 };
const td: React.CSSProperties = { padding: '10px 12px', fontSize: 13, verticalAlign: 'top' };
const btn: React.CSSProperties = { padding: '6px 10px' };

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
