import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { OrderType, OrderSide, OrderStatus } from './orders.types';

describe('OrdersService', () => {
  let service: OrdersService;
  let repository: OrdersRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: OrdersRepository,
          useValue: {
            getInstrumentById: jest.fn(),
            getLatestMarketData: jest.fn(),
            getAvailableCash: jest.fn(),
            getAvailableShares: jest.fn(),
            createOrder: jest.fn(),
            getOrderById: jest.fn(),
            updateOrderStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    repository = module.get<OrdersRepository>(OrdersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create a MARKET order successfully', async () => {
      const createOrderDto = {
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        size: 10,
      };

      const mockInstrument = { id: 1, ticker: 'AAPL', name: 'Apple Inc.' };
      const mockMarketData = { close: '150.00' };
      const mockOrder = {
        id: 1,
        instrumentId: 1,
        userId: 1,
        size: 10,
        price: '150.00',
        type: OrderType.MARKET,
        side: OrderSide.BUY,
        status: OrderStatus.FILLED,
        datetime: new Date(),
      };

      jest
        .spyOn(repository, 'getInstrumentById')
        .mockResolvedValue(mockInstrument as any);
      jest
        .spyOn(repository, 'getLatestMarketData')
        .mockResolvedValue(mockMarketData as any);
      jest.spyOn(repository, 'getAvailableCash').mockResolvedValue('2000.00');
      jest.spyOn(repository, 'createOrder').mockResolvedValue(mockOrder as any);

      const result = await service.createOrder(1, createOrderDto);

      expect(result.type).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data.type).toBe(OrderType.MARKET);
      expect(result.data.status).toBe(OrderStatus.FILLED);
    });

    it('should create a LIMIT order successfully', async () => {
      const createOrderDto = {
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        size: 10,
        price: 145.0,
      };

      const mockInstrument = { id: 1, ticker: 'AAPL', name: 'Apple Inc.' };
      const mockOrder = {
        id: 1,
        instrumentId: 1,
        userId: 1,
        size: 10,
        price: '145.00',
        type: OrderType.LIMIT,
        side: OrderSide.BUY,
        status: OrderStatus.NEW,
        datetime: new Date(),
      };

      jest
        .spyOn(repository, 'getInstrumentById')
        .mockResolvedValue(mockInstrument as any);
      jest.spyOn(repository, 'getAvailableCash').mockResolvedValue('2000.00');
      jest.spyOn(repository, 'createOrder').mockResolvedValue(mockOrder as any);

      const result = await service.createOrder(1, createOrderDto);

      expect(result.type).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.data.type).toBe(OrderType.LIMIT);
      expect(result.data.status).toBe(OrderStatus.NEW);
    });

    it('should reject order with insufficient funds', async () => {
      const createOrderDto = {
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        size: 10,
      };

      const mockInstrument = { id: 1, ticker: 'AAPL', name: 'Apple Inc.' };
      const mockMarketData = { close: '150.00' };

      jest
        .spyOn(repository, 'getInstrumentById')
        .mockResolvedValue(mockInstrument as any);
      jest
        .spyOn(repository, 'getLatestMarketData')
        .mockResolvedValue(mockMarketData as any);
      jest.spyOn(repository, 'getAvailableCash').mockResolvedValue('100.00'); // Insufficient funds

      const result = await service.createOrder(1, createOrderDto);

      expect(result.type).toBe('failed');
      expect(result.message).toBe('Insufficient funds');
    });
  });
});
