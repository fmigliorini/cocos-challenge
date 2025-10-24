import { OrderFactory } from './order-factory';
import { MarketOrder } from './market-order.entity';
import { LimitOrder } from './limit-order.entity';
import { CashOrder } from './cash-order.entity';
import { OrderType, OrderSide, OrderStatus } from '../orders.types';

describe('OrderFactory', () => {
  const baseOrderData = {
    userId: 1,
    instrumentId: 1,
    side: OrderSide.BUY,
    size: 10,
    price: '150.50',
  };

  describe('createOrder', () => {
    it('should create MarketOrder for MARKET type', () => {
      // Arrange
      const orderData = {
        ...baseOrderData,
        type: OrderType.MARKET,
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(MarketOrder);
      expect(order.type).toBe(OrderType.MARKET);
      expect(order.userId).toBe(1);
      expect(order.instrumentId).toBe(1);
      expect(order.side).toBe(OrderSide.BUY);
      expect(order.size).toBe(10);
      expect(order.price).toBe('150.50');
    });

    it('should create LimitOrder for LIMIT type', () => {
      // Arrange
      const orderData = {
        ...baseOrderData,
        type: OrderType.LIMIT,
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(LimitOrder);
      expect(order.type).toBe(OrderType.LIMIT);
      expect(order.userId).toBe(1);
      expect(order.instrumentId).toBe(1);
      expect(order.side).toBe(OrderSide.BUY);
      expect(order.size).toBe(10);
      expect(order.price).toBe('150.50');
    });

    it('should create CashOrder for CASH_IN side', () => {
      // Arrange
      const orderData = {
        ...baseOrderData,
        type: OrderType.MARKET,
        side: OrderSide.CASH_IN,
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(CashOrder);
      expect(order.type).toBe(OrderType.MARKET);
      expect(order.side).toBe(OrderSide.CASH_IN);
    });

    it('should create CashOrder for CASH_OUT side', () => {
      // Arrange
      const orderData = {
        ...baseOrderData,
        type: OrderType.MARKET,
        side: OrderSide.CASH_OUT,
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(CashOrder);
      expect(order.type).toBe(OrderType.MARKET);
      expect(order.side).toBe(OrderSide.CASH_OUT);
    });

    it('should throw error when type is not provided', () => {
      // Arrange
      const orderData = {
        ...baseOrderData,
        // type is missing
      };

      // Act & Assert
      expect(() => OrderFactory.createOrder(orderData)).toThrow(
        'Order type is required',
      );
    });

    it('should throw error for unknown order type', () => {
      // Arrange
      const orderData = {
        ...baseOrderData,
        type: 'UNKNOWN' as unknown as OrderType,
      };

      // Act & Assert
      expect(() => OrderFactory.createOrder(orderData)).toThrow(
        'Unknown order type: UNKNOWN',
      );
    });

    it('should handle partial order data', () => {
      // Arrange
      const orderData = {
        userId: 1,
        instrumentId: 1,
        type: OrderType.MARKET,
        side: OrderSide.BUY,
        // size and price are missing
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(MarketOrder);
      expect(order.userId).toBe(1);
      expect(order.instrumentId).toBe(1);
      expect(order.type).toBe(OrderType.MARKET);
      expect(order.side).toBe(OrderSide.BUY);
    });

    it('should preserve all order properties', () => {
      // Arrange
      const orderData = {
        userId: 2,
        instrumentId: 3,
        side: OrderSide.SELL,
        type: OrderType.LIMIT,
        size: 5,
        price: '200.00',
        status: OrderStatus.NEW,
        datetime: new Date('2023-01-01'),
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order.userId).toBe(2);
      expect(order.instrumentId).toBe(3);
      expect(order.side).toBe(OrderSide.SELL);
      expect(order.type).toBe(OrderType.LIMIT);
      expect(order.size).toBe(5);
      expect(order.price).toBe('200.00');
      expect(order.status).toBe(OrderStatus.NEW);
      expect(order.datetime).toEqual(new Date('2023-01-01'));
    });
  });

  describe('order type determination', () => {
    it('should prioritize CASH_IN over type for order creation', () => {
      // Arrange
      const orderData = {
        ...baseOrderData,
        type: OrderType.LIMIT, // This should be ignored
        side: OrderSide.CASH_IN,
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(CashOrder);
      expect(order.side).toBe(OrderSide.CASH_IN);
    });

    it('should prioritize CASH_OUT over type for order creation', () => {
      // Arrange
      const orderData = {
        ...baseOrderData,
        type: OrderType.MARKET, // This should be ignored
        side: OrderSide.CASH_OUT,
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(CashOrder);
      expect(order.side).toBe(OrderSide.CASH_OUT);
    });

    it('should use type when side is not CASH_IN or CASH_OUT', () => {
      // Arrange
      const orderData = {
        ...baseOrderData,
        type: OrderType.LIMIT,
        side: OrderSide.BUY, // Regular trading side
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(LimitOrder);
      expect(order.type).toBe(OrderType.LIMIT);
    });
  });

  describe('edge cases', () => {
    it('should handle null and undefined values', () => {
      // Arrange
      const orderData = {
        userId: 1,
        instrumentId: 1,
        type: OrderType.MARKET,
        side: OrderSide.BUY,
        size: null,
        price: undefined,
      } as unknown as Parameters<typeof OrderFactory.createOrder>[0];

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(MarketOrder);
      expect(order.size).toBeNull();
      expect(order.price).toBeUndefined();
    });

    it('should handle empty object', () => {
      // Arrange
      const orderData = {
        type: OrderType.MARKET,
      };

      // Act
      const order = OrderFactory.createOrder(orderData);

      // Assert
      expect(order).toBeInstanceOf(MarketOrder);
      expect(order.type).toBe(OrderType.MARKET);
    });
  });
});
