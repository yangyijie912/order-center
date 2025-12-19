import type { OrderAction } from './rules';

export const UI_ACTION_TO_RULE_ACTION = {
  DELETE: 'DELETE',
  VIEW_DETAIL: 'VIEW_DETAIL',
} as const satisfies Partial<Record<string, OrderAction>>;

export type RuleBackedUIActionKey = keyof typeof UI_ACTION_TO_RULE_ACTION;
