import type { OrderStatus } from '../domain/types';
import type { TagProps } from 'beaver-ui';

// 中央化的状态到 Tag 配置映射（放在 ui 目录，明确这是 UI 配置）
// - 方便统一管理、可读性好、易扩展
// - 优先使用语义 type，当需要精确配色时使用 customColor

export const STATUS_LIST: OrderStatus[] = [
  'pending',
  'paying',
  'payment_failed',
  'paid',
  'shipped',
  'completed',
  'cancelled',
  'refunded',
];

type SimpleTagMeta = Pick<TagProps, 'type' | 'variant' | 'size' | 'customColor'>;

export const STATUS_TAG_MAP: Record<OrderStatus, SimpleTagMeta> = {
  pending: { type: 'warning', variant: 'light', size: 'small', customColor: { bg: '#fff4e5', text: '#b36b00' } },
  paying: { type: 'warning', variant: 'light', size: 'small', customColor: { bg: '#fff7e6', text: '#b36b00' } },
  payment_failed: { type: 'error', variant: 'light', size: 'small', customColor: { bg: '#fff1f0', text: '#a8071a' } },
  paid: { type: 'primary', variant: 'light', size: 'small', customColor: { bg: '#e6f7ff', text: '#096dd9' } },
  shipped: { type: 'default', variant: 'light', size: 'small', customColor: { bg: '#f0f5ff', text: '#2f54eb' } },
  completed: { type: 'success', variant: 'light', size: 'small', customColor: { bg: '#f6ffed', text: '#237804' } },
  cancelled: { type: 'default', variant: 'light', size: 'small', customColor: { bg: '#f5f5f5', text: '#8c8c8c' } },
  refunded: { type: 'error', variant: 'light', size: 'small', customColor: { bg: '#fff1f0', text: '#a8071a' } },
};

export function getTagPropsForStatus(status: OrderStatus): SimpleTagMeta {
  return STATUS_TAG_MAP[status] ?? { type: 'default', variant: 'light', size: 'small' };
}

export default STATUS_TAG_MAP;
