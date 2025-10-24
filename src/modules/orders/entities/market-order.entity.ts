import { ChildEntity } from 'typeorm';
import { Order } from './order.entity';
import { OrderStatus, OrderType } from '../orders.types';

@ChildEntity('MARKET')
export class MarketOrder extends Order {
  constructor() {
    super();
    this.status = OrderStatus.FILLED;
  }

  // MARKET orders can only be FILLED or REJECTED
  setStatus(status: OrderStatus): void {
    if (status !== OrderStatus.FILLED && status !== OrderStatus.REJECTED) {
      throw new Error(
        `Invalid status for MARKET order: ${status}. Only FILLED or REJECTED are allowed.`,
      );
    }
    this.status = status;
  }

  // MARKET orders are immediately FILLED when created
  markAsFilled(): void {
    this.setStatus(OrderStatus.FILLED);
  }

  // MARKET orders can be rejected
  markAsRejected(): void {
    this.setStatus(OrderStatus.REJECTED);
  }
}
