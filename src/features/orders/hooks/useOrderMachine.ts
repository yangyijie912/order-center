import { useStateMachine } from '@/hooks/useStateMachine';
import { orderTransitions, type OrderEvent, type OrderContext } from '../domain/stateMachine';
import type { OrderStatus } from '../domain/types';

export function useOrderMachine(initialStatus: OrderStatus, ctx: OrderContext) {
  return useStateMachine<OrderStatus, OrderContext, OrderEvent>({
    initialState: initialStatus,
    ctx,
    transitions: orderTransitions,
  });
}
