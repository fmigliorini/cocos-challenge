import { MarketOrder } from './market-order.entity';
import { LimitOrder } from './limit-order.entity';
import { CashOrder } from './cash-order.entity';
import { Order } from './order.entity';
import { OrderStatus, OrderType } from '../orders.types';

describe('Order Entities', () => {
  describe('MarketOrder', () => {
    let sut: MarketOrder;

    beforeEach(() => {
      // Arrange
      sut = new MarketOrder();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(sut).toBeDefined();
      expect(sut).toBeInstanceOf(Order);
      expect(sut).toBeInstanceOf(MarketOrder);
    });

    it('should initialize with correct type and status', () => {
      // Assert
      expect(sut.type).toBe(OrderType.MARKET);
      expect(sut.status).toBe(OrderStatus.FILLED);
    });

    // Key test for MarketOrder is to check if the status is set correctly when the order is created.
    describe('setStatus', () => {
      it('should allow FILLED status', () => {
        // Act
        sut.setStatus(OrderStatus.FILLED);

        // Assert
        expect(sut.status).toBe(OrderStatus.FILLED);
      });

      it('should allow REJECTED status', () => {
        // Act
        sut.setStatus(OrderStatus.REJECTED);

        // Assert
        expect(sut.status).toBe(OrderStatus.REJECTED);
      });

      it('should reject NEW status', () => {
        // Act & Assert
        expect(() => sut.setStatus(OrderStatus.NEW)).toThrow(
          'Invalid status for MARKET order: NEW. Only FILLED or REJECTED are allowed.',
        );
      });

      it('should reject CANCELLED status', () => {
        // Act & Assert
        expect(() => sut.setStatus(OrderStatus.CANCELLED)).toThrow(
          'Invalid status for MARKET order: CANCELLED. Only FILLED or REJECTED are allowed.',
        );
      });
    });

    // Some internal operations test
    describe('markAsFilled', () => {
      it('should set status to FILLED', () => {
        // Act
        sut.markAsFilled();

        // Assert
        expect(sut.status).toBe(OrderStatus.FILLED);
      });
    });

    describe('markAsRejected', () => {
      it('should set status to REJECTED', () => {
        // Act
        sut.markAsRejected();

        // Assert
        expect(sut.status).toBe(OrderStatus.REJECTED);
      });
    });
  });

  describe('LimitOrder', () => {
    let sut: LimitOrder;

    beforeEach(() => {
      // Arrange
      sut = new LimitOrder();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(sut).toBeDefined();
      expect(sut).toBeInstanceOf(Order);
      expect(sut).toBeInstanceOf(LimitOrder);
    });

    it('should initialize with correct type and status', () => {
      // Assert
      expect(sut.type).toBe(OrderType.LIMIT);
      expect(sut.status).toBe(OrderStatus.NEW);
    });

    // Available status for LIMIT order.
    describe('setStatus', () => {
      it('should allow NEW status', () => {
        // Act
        sut.setStatus(OrderStatus.NEW);

        // Assert
        expect(sut.status).toBe(OrderStatus.NEW);
      });

      it('should allow FILLED status', () => {
        // Act
        sut.setStatus(OrderStatus.FILLED);

        // Assert
        expect(sut.status).toBe(OrderStatus.FILLED);
      });

      // Posible status REJECTED?
      it('should allow REJECTED status', () => {
        // Act
        sut.setStatus(OrderStatus.REJECTED);

        // Assert
        expect(sut.status).toBe(OrderStatus.REJECTED);
      });

      it('should allow CANCELLED status', () => {
        // Act
        sut.setStatus(OrderStatus.CANCELLED);

        // Assert
        expect(sut.status).toBe(OrderStatus.CANCELLED);
      });
    });

    describe('markAsNew', () => {
      it('should set status to NEW', () => {
        // Act
        sut.markAsNew();

        // Assert
        expect(sut.status).toBe(OrderStatus.NEW);
      });
    });

    // Avoid inalid transitions :)
    describe('markAsCancelled', () => {
      it('should set status to CANCELLED when order is NEW', () => {
        // Arrange
        sut.status = OrderStatus.NEW;

        // Act
        sut.markAsCancelled();

        // Assert
        expect(sut.status).toBe(OrderStatus.CANCELLED);
      });

      it('should throw error when trying to cancel non-NEW order', () => {
        // Arrange
        sut.status = OrderStatus.FILLED;

        // Act & Assert
        expect(() => sut.markAsCancelled()).toThrow(
          'Only NEW LIMIT orders can be cancelled',
        );
      });

      it('should throw error when order is already CANCELLED', () => {
        // Arrange
        sut.status = OrderStatus.CANCELLED;

        // Act & Assert
        expect(() => sut.markAsCancelled()).toThrow(
          'Only NEW LIMIT orders can be cancelled',
        );
      });

      it('should throw error when order is REJECTED', () => {
        // Arrange
        sut.status = OrderStatus.REJECTED;

        // Act & Assert
        expect(() => sut.markAsCancelled()).toThrow(
          'Only NEW LIMIT orders can be cancelled',
        );
      });
    });
  });

  describe('CashOrder', () => {
    let sut: CashOrder;

    beforeEach(() => {
      // Arrange
      sut = new CashOrder();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should be defined', () => {
      expect(sut).toBeDefined();
      expect(sut).toBeInstanceOf(Order);
      expect(sut).toBeInstanceOf(CashOrder);
    });

    // CASH operations are treated as MARKET.
    it('should initialize with MARKET type (CASH operations are treated as MARKET)', () => {
      // Assert
      expect(sut.type).toBe(OrderType.MARKET);
    });

    // Always initialized with FILLED status.
    it('should initialize with FILLED status', () => {
      // Assert
      expect(sut.status).toBe(OrderStatus.FILLED);
    });

    // Posible status FILLED.
    describe('markAsFilled', () => {
      it('should set status to FILLED', () => {
        // Act
        sut.markAsFilled();

        // Assert
        expect(sut.status).toBe(OrderStatus.FILLED);
      });
    });

    // Posible status REJECTED.
    describe('markAsRejected', () => {
      it('should set status to REJECTED', () => {
        // Act
        sut.markAsRejected();

        // Assert
        expect(sut.status).toBe(OrderStatus.REJECTED);
      });
    });
  });
});
