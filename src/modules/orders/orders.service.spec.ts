import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderType, OrderSide, OrderStatus } from './orders.types';
import { ResultCode } from '../../core/common-types';
import { CreateOrderData } from './orders.repository';
import { Instrument } from '../instruments/entities/instrument.entity';
import { InstrumentType } from '../instruments/instruments.type';
import { MarketData } from '../market-data/entities/market-data.entity';

describe('OrdersService', () => {
  let sut: OrdersService;
  let ordersRepository: OrdersRepository;
  let mockOrdersRepository: Record<string, jest.Mock>;

  const mockInstrument = {
    id: 1,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    type: InstrumentType.ACCIONES,
    orders: [],
    marketData: [],
  } as Instrument;

  const mockMarketData = {
    id: 1,
    instrumentId: 1,
    close: '150.50',
    high: '155.00',
    low: '148.00',
    open: '149.00',
    volume: 1000000,
    date: new Date(),
    previousClose: '149.50',
    instrument: mockInstrument,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as MarketData; // small hack to initialize the market data object. :) 

  const mockOrder = {
    id: 1,
    userId: 1,
    instrumentId: 1,
    side: OrderSide.BUY,
    type: OrderType.MARKET,
    size: 5,
    price: '150.50',
    status: OrderStatus.FILLED,
    datetime: new Date(),
  };

  beforeEach(async () => {
    mockOrdersRepository = {
      getInstrumentById: jest.fn(),
      getLatestMarketData: jest.fn(),
      getAvailableCash: jest.fn(),
      getAvailableShares: jest.fn(),
      getReservedCash: jest.fn(),
      createOrder: jest.fn(),
    };

    // create a testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: mockOrdersRepository,
        },
      ],
    }).compile();

    // get the service from the module
    sut = module.get<OrdersService>(OrdersService);
    ordersRepository = module.get<OrdersRepository>(OrdersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should have OrdersRepository injected', () => {
    expect(ordersRepository).toBeDefined();
  });

  describe('createOrder', () => {
    const userId = 1;

    beforeEach(() => {
      mockOrdersRepository.getInstrumentById.mockResolvedValue(
        mockInstrument.id,
      );
      mockOrdersRepository.getLatestMarketData.mockResolvedValue(
        mockMarketData,
      );
      mockOrdersRepository.getAvailableCash.mockResolvedValue('1000.00');
      mockOrdersRepository.getAvailableShares.mockResolvedValue('10');
      mockOrdersRepository.getReservedCash.mockResolvedValue('0.00');
      mockOrdersRepository.createOrder.mockImplementation(
        (data: CreateOrderData) => {
          // Return different mock orders based on the order type and side
          // Required because of the child entities.
          const orderType = data.type || OrderType.MARKET;
          const orderSide = data.side || OrderSide.BUY;
          const orderStatus =
            orderType === OrderType.LIMIT
              ? OrderStatus.NEW
              : OrderStatus.FILLED;

          return Promise.resolve({
            ...mockOrder,
            type: orderType,
            side: orderSide,
            status: orderStatus,
            size: data.size,
            price: data.price || null,
          });
        },
      );
    });

    // Market orders. (Buy and sell)
    describe('MARKET orders', () => {
      it('should create a MARKET order successfully', async () => {
        // Arrange
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          amount: 750,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.SUCCESS);
        if (result.type === ResultCode.SUCCESS) {
          expect(result.data).toBeDefined();
          expect(result.data.type).toBe(OrderType.MARKET);
        }
      });

      it('should create a MARKET order with provided size', async () => {
        // Arrange
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          size: 3,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.SUCCESS);
      });

      it('should reject MARKET order when market data is not available', async () => {
        // Arrange
        mockOrdersRepository.getLatestMarketData.mockResolvedValue(null);
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          amount: 750,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.FAILED);
        if (result.type === ResultCode.FAILED) {
          expect(result.message).toBe(
            'Market data not available for instrument',
          );
        }
      });
    });

    // Limit orders. (New)
    describe('LIMIT orders', () => {
      it('should create a LIMIT order successfully', async () => {
        // Arrange
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.LIMIT,
          price: 140.0,
          amount: 700,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.SUCCESS);
        if (result.type === ResultCode.SUCCESS) {
          expect(result.data).toBeDefined();
          expect(result.data.type).toBe(OrderType.LIMIT);
          expect(result.data.status).toBe(OrderStatus.NEW);
        }
      });

      it('should create a LIMIT order with provided size', async () => {
        // Arrange
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.LIMIT,
          price: 140.0,
          size: 2,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.SUCCESS);
      });
    });

    // Cash orders. (Deposits and withdrawals)
    describe('CASH orders', () => {
      it('should create a CASH_IN order successfully', async () => {
        // Arrange
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.CASH_IN,
          type: OrderType.MARKET,
          amount: 500,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.SUCCESS);
        if (result.type === ResultCode.SUCCESS) {
          expect(result.data.side).toBe(OrderSide.CASH_IN);
        }
      });

      it('should create a CASH_OUT order successfully', async () => {
        // Arrange
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.CASH_OUT,
          type: OrderType.MARKET,
          amount: 200,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.SUCCESS);
        if (result.type === ResultCode.SUCCESS) {
          expect(result.data.side).toBe(OrderSide.CASH_OUT);
        }
      });
    });

    // Main edge cases.
    describe('validation', () => {
      it('should reject order when instrument is not found', async () => {
        // Arrange
        mockOrdersRepository.getInstrumentById.mockResolvedValue(null);
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          amount: 750,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.FAILED);
        if (result.type === ResultCode.FAILED) {
          expect(result.message).toBe('Instrument not found');
        }
      });

      it('should reject order with insufficient funds for BUY', async () => {
        // Arrange
        mockOrdersRepository.getAvailableCash.mockResolvedValue('100.00');
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          amount: 750,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.FAILED);
        if (result.type === ResultCode.FAILED) {
          expect(result.message).toBe('Insufficient funds');
        }
      });

      it('should reject order with insufficient shares for SELL', async () => {
        // Arrange
        mockOrdersRepository.getAvailableShares.mockResolvedValue('2');
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.SELL,
          type: OrderType.MARKET,
          size: 5,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.FAILED);
        if (result.type === ResultCode.FAILED) {
          expect(result.message).toBe('Insufficient shares');
        }
      });

      it('should reject order with invalid size', async () => {
        // Arrange
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          amount: 0,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.FAILED);
        if (result.type === ResultCode.FAILED) {
          expect(result.message).toContain('Invalid order size');
        }
      });
    });

    describe('error handling', () => {
      it('should handle repository errors gracefully', async () => {
        // Arrange
        mockOrdersRepository.getInstrumentById.mockRejectedValue(
          new Error('Database error'),
        );
        const createOrderDto: CreateOrderDto = {
          instrumentId: 1,
          side: OrderSide.BUY,
          type: OrderType.MARKET,
          amount: 750,
        };

        // Act
        const result = await sut.createOrder(userId, createOrderDto);

        // Assert
        expect(result.type).toBe(ResultCode.FAILED);
        if (result.type === ResultCode.FAILED) {
          expect(result.message).toBe('Failed to create order');
        }
      });
    });
  });
});
