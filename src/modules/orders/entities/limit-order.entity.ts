import { Order } from './order.entity';
import { OrderStatus, OrderType } from '../orders.types';

export class LimitOrder extends Order {
  constructor() {
    super();
    this.status = OrderStatus.NEW;
    this.type = OrderType.LIMIT;
  }

  /**
   * @TODO: this is a temporary solution to allow the order to be NEW, FILLED, REJECTED, or CANCELLED
   * The first time it is mandatory to be NEW but actually we later should
   * allow this to be FILLED or REJECTED. A good way to do that is generate a transaction
   * that will update the status to FILLED or REJECTED from the NEW state.
   */
  setStatus(status: OrderStatus): void {
    if (
      ![
        OrderStatus.NEW,
        OrderStatus.FILLED,
        OrderStatus.REJECTED,
        OrderStatus.CANCELLED,
      ].includes(status)
    ) {
      throw new Error(
        `Invalid status for LIMIT order: ${status}. Only NEW, FILLED, REJECTED, or CANCELLED are allowed.`,
      );
    }
    this.status = status;
  }

  // LIMIT orders start as NEW
  markAsNew(): void {
    this.setStatus(OrderStatus.NEW);
  }

  // LIMIT orders can be cancelled (only if NEW)
  markAsCancelled(): void {
    if (this.status !== OrderStatus.NEW) {
      throw new Error('Only NEW LIMIT orders can be cancelled');
    }
    this.setStatus(OrderStatus.CANCELLED);
  }
}
