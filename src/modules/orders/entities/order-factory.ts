import { Order } from './order.entity';
import { MarketOrder } from './market-order.entity';
import { LimitOrder } from './limit-order.entity';
import { CashOrder } from './cash-order.entity';
import { OrderType, OrderSide } from '../orders.types';

export class OrderFactory {
  static createOrder(
    data: Partial<Order>,
  ): MarketOrder | LimitOrder | CashOrder {
    const { type, side } = data;

    if (!type) {
      throw new Error('Order type is required');
    }

    // CASH_IN and CASH_OUT are cash orders
    if (side === OrderSide.CASH_IN || side === OrderSide.CASH_OUT) {
      const cashOrder = new CashOrder();
      Object.assign(cashOrder, data);
      return cashOrder;
    }

    // Regular trading orders
    switch (type) {
      case OrderType.MARKET: {
        const marketOrder = new MarketOrder();
        Object.assign(marketOrder, data);
        return marketOrder;
      }
      case OrderType.LIMIT: {
        const limitOrder = new LimitOrder();
        Object.assign(limitOrder, data);
        return limitOrder;
      }
      default:
        throw new Error(`Unknown order type: ${String(type)}`);
    }
  }
}
