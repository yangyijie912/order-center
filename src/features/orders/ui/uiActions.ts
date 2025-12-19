import type { OrderEvent } from '../domain/stateMachine';

export type UIActionKey = 'VIEW_DETAIL' | 'CANCEL' | 'DELETE' | 'REFUND' | 'PAY' | 'SHIP';

export const UI_ACTIONS: Record<
  UIActionKey,
  {
    label: string;
    eventType?: OrderEvent['type'];
    confirm?: { title?: string; description?: string; okText?: string; cancelText?: string; okVariant?: string };
    /** 可选十六进制颜色，由组件使用作为按钮文本色 */
    color?: string;
  }
> = {
  VIEW_DETAIL: { label: '详情', color: '#4FA3FF' },
  PAY: { label: '支付', eventType: 'PAY', color: '#0B66FF' },
  CANCEL: {
    label: '取消',
    eventType: 'CANCEL',
    color: '#585a61',
    confirm: { title: '确认取消？', okText: '确定', cancelText: '取消' },
  },
  DELETE: {
    label: '删除',
    confirm: { title: '确认删除？', okText: '删除', cancelText: '取消', okVariant: 'ghost' },
    color: '#FF4D4F',
  },
  REFUND: { label: '退款', eventType: 'REFUND', color: '#FF7A45' },
  SHIP: { label: '发货', eventType: 'SHIP', color: '#16A34A' },
};
