import { Order } from './order.entity';
import { OrderStatus, OrderType } from '../orders.types';

export class CashOrder extends Order {
  constructor() {
    super();
    this.status = OrderStatus.FILLED;
    this.type = OrderType.MARKET;
  }

  // Cash orders can be FILLED or REJECTED
  setStatus(status: OrderStatus): void {
    if (status !== OrderStatus.FILLED && status !== OrderStatus.REJECTED) {
      throw new Error(
        `Invalid status for CASH order: ${status}. Only FILLED or REJECTED are allowed.`,
      );
    }
    this.status = status;
  }

  // Cash orders are immediately FILLED when created
  markAsFilled(): void {
    this.setStatus(OrderStatus.FILLED);
  }

  // Cash orders can be rejected
  markAsRejected(): void {
    this.setStatus(OrderStatus.REJECTED);
  }
}
