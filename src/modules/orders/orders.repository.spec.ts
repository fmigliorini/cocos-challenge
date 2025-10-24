import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersRepository } from './orders.repository';
import { Order } from './entities/order.entity';
import { Instrument } from '../instruments/entities/instrument.entity';
import { MarketData } from '../market-data/entities/market-data.entity';
import { OrderType, OrderSide, OrderStatus } from './orders.types';

describe('OrdersRepository', () => {
  let sut: OrdersRepository;
  let mockOrderRepo: Repository<Order>;
  let mockInstrumentRepo: Repository<Instrument>;
  let mockMarketDataRepo: Repository<MarketData>;
  let ordersCreateQueryBuilderSpy: jest.SpyInstance;
  let ordersCreateSpy: jest.SpyInstance;
  let ordersSaveSpy: jest.SpyInstance;
  let instrumentsFindOneSpy: jest.SpyInstance;
  let marketDataFindOneSpy: jest.SpyInstance;

  beforeEach(async () => {
    // Create mock repositories with jest functions
    const mockOrderRepoFunctions: Partial<Repository<Order>> = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockInstrumentRepoFunctions: Partial<Repository<Instrument>> = {
      findOne: jest.fn(),
    };

    const mockMarketDataRepoFunctions: Partial<Repository<MarketData>> = {
      findOne: jest.fn(),
    };

    mockOrderRepo = mockOrderRepoFunctions as Repository<Order>;
    mockInstrumentRepo = mockInstrumentRepoFunctions as Repository<Instrument>;
    mockMarketDataRepo = mockMarketDataRepoFunctions as Repository<MarketData>;

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersRepository,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrderRepo,
        },
        {
          provide: getRepositoryToken(Instrument),
          useValue: mockInstrumentRepo,
        },
        {
          provide: getRepositoryToken(MarketData),
          useValue: mockMarketDataRepo,
        },
      ],
    }).compile();

    // Get the repository from the module
    sut = module.get<OrdersRepository>(OrdersRepository);

    // Create spies - type them as jest mock functions
    ordersCreateQueryBuilderSpy = jest.spyOn(
      mockOrderRepoFunctions,
      'createQueryBuilder',
    );
    ordersCreateSpy = jest.spyOn(mockOrderRepoFunctions, 'create');
    ordersSaveSpy = jest.spyOn(mockOrderRepoFunctions, 'save');
    instrumentsFindOneSpy = jest.spyOn(mockInstrumentRepoFunctions, 'findOne');
    marketDataFindOneSpy = jest.spyOn(mockMarketDataRepoFunctions, 'findOne');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create and save an order successfully', async () => {
      // Arrange
      const orderData = {
        userId: 1,
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        size: 10,
        price: '150.50',
        status: OrderStatus.FILLED,
      };
      const mockOrder: Order = { id: 1, ...orderData } as unknown as Order;
      ordersCreateSpy.mockReturnValue(mockOrder);
      ordersSaveSpy.mockResolvedValue(mockOrder);

      // Act
      const result = await sut.createOrder(orderData);

      // Assert
      expect(ordersCreateSpy).toHaveBeenCalledWith(orderData);
      expect(ordersSaveSpy).toHaveBeenCalledWith(mockOrder);
      expect(result).toEqual(mockOrder);
    });

    it('should handle repository errors when saving', async () => {
      // Arrange
      const orderData = {
        userId: 1,
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        size: 10,
        price: '150.50',
        status: OrderStatus.FILLED,
      };
      ordersCreateSpy.mockReturnValue({} as unknown as Order);
      ordersSaveSpy.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(sut.createOrder(orderData)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getInstrumentById', () => {
    it('should return instrument when found', async () => {
      // Arrange
      const instrumentId = 1;
      const mockInstrument: Instrument = {
        id: instrumentId,
        ticker: 'AAPL',
        name: 'Apple Inc.',
        type: 'STOCK',
      } as unknown as Instrument;
      instrumentsFindOneSpy.mockResolvedValue(mockInstrument);

      // Act
      const result = await sut.getInstrumentById(instrumentId);

      // Assert
      expect(instrumentsFindOneSpy).toHaveBeenCalledWith({
        where: { id: instrumentId },
      });
      expect(result).toEqual(mockInstrument);
    });

    it('should return null when instrument is not found', async () => {
      // Arrange
      instrumentsFindOneSpy.mockResolvedValue(null);

      // Act
      const result = await sut.getInstrumentById(999);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      instrumentsFindOneSpy.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(sut.getInstrumentById(1)).rejects.toThrow('Database error');
    });
  });

  describe('getLatestMarketData', () => {
    it('should return latest market data when found', async () => {
      // Arrange
      const instrumentId = 1;
      const mockMarketData: MarketData = {
        id: 1,
        instrumentId,
        close: '150.50',
        previousClose: '149.50',
      } as unknown as MarketData;
      marketDataFindOneSpy.mockResolvedValue(mockMarketData);

      // Act
      const result = await sut.getLatestMarketData(instrumentId);

      // Assert
      expect(marketDataFindOneSpy).toHaveBeenCalledWith({
        where: { instrument: { id: instrumentId } },
        order: { date: 'DESC' },
      });
      expect(result).toEqual(mockMarketData);
    });

    it('should return null when market data is not found', async () => {
      // Arrange
      marketDataFindOneSpy.mockResolvedValue(null);

      // Act
      const result = await sut.getLatestMarketData(999);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      marketDataFindOneSpy.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(sut.getLatestMarketData(1)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getAvailableCash', () => {
    it('should calculate available cash correctly', async () => {
      // Arrange
      const userId = 1;
      const mockResult = { cash: '5000.50' };
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };
      ordersCreateQueryBuilderSpy.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await sut.getAvailableCash(userId);

      // Assert
      expect(ordersCreateQueryBuilderSpy).toHaveBeenCalledWith('o');
      expect(result).toBe('5000.50');
    });

    it('should return 0 when user has no cash', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      ordersCreateQueryBuilderSpy.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await sut.getAvailableCash(1);

      // Assert
      expect(result).toBe('0');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      ordersCreateQueryBuilderSpy.mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(sut.getAvailableCash(1)).rejects.toThrow('Database error');
    });
  });

  describe('getAvailableShares', () => {
    it('should calculate available shares correctly', async () => {
      // Arrange
      const userId = 1;
      const instrumentId = 1;
      const mockResult = { shares: 25 };
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };
      ordersCreateQueryBuilderSpy.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await sut.getAvailableShares(userId, instrumentId);

      // Assert
      expect(ordersCreateQueryBuilderSpy).toHaveBeenCalledWith('o');
      expect(result).toBe(25);
    });

    it('should return 0 when user has no shares', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      ordersCreateQueryBuilderSpy.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await sut.getAvailableShares(1, 1);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      ordersCreateQueryBuilderSpy.mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(sut.getAvailableShares(1, 1)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getReservedCash', () => {
    it('should calculate reserved cash correctly', async () => {
      // Arrange
      const userId = 1;
      const mockResult = { reserved: '2000.00' };
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(mockResult),
      };
      ordersCreateQueryBuilderSpy.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await sut.getReservedCash(userId);

      // Assert
      expect(ordersCreateQueryBuilderSpy).toHaveBeenCalledWith('o');
      expect(result).toBe('2000.00');
    });

    it('should return 0 when no cash is reserved', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(null),
      };
      ordersCreateQueryBuilderSpy.mockReturnValue(mockQueryBuilder);

      // Act
      const result = await sut.getReservedCash(1);

      // Assert
      expect(result).toBe('0');
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockRejectedValue(new Error('Database error')),
      };
      ordersCreateQueryBuilderSpy.mockReturnValue(mockQueryBuilder);

      // Act & Assert
      await expect(sut.getReservedCash(1)).rejects.toThrow('Database error');
    });
  });
});
