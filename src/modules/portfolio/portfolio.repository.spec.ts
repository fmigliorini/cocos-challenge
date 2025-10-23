import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { PortfolioRepository } from './portfolio.repository';
import { Order } from '../orders/entities/order.entity';
import { Instrument } from '../instruments/entities/instrument.entity';
import { MarketData } from '../market-data/entities/market-data.entity';

describe('PortfolioRepository', () => {
  let repository: PortfolioRepository;
  let ordersRepository: jest.Mocked<Repository<Order>>;
  let instrumentsRepository: jest.Mocked<Repository<Instrument>>;
  let marketDataRepository: jest.Mocked<Repository<MarketData>>;
  // let loggerSpy: jest.SpyInstance;
  let ordersCreateQueryBuilderSpy: jest.SpyInstance;
  let marketDataCreateQueryBuilderSpy: jest.SpyInstance;

  // Helper function to create a complete mock query builder
  const createMockQueryBuilder = (mockResult: any) => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getQuery: jest.fn().mockReturnValue('SELECT * FROM test'),
    getParameters: jest.fn().mockReturnValue({}),
    getRawMany: jest.fn().mockResolvedValue(mockResult),
    getRawOne: jest.fn().mockResolvedValue(mockResult),
  });

  beforeEach(async () => {
    const mockOrdersRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockInstrumentsRepository = {
      createQueryBuilder: jest.fn(),
    };

    const mockMarketDataRepository = {
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioRepository,
        {
          provide: getRepositoryToken(Order),
          useValue: mockOrdersRepository,
        },
        {
          provide: getRepositoryToken(Instrument),
          useValue: mockInstrumentsRepository,
        },
        {
          provide: getRepositoryToken(MarketData),
          useValue: mockMarketDataRepository,
        },
      ],
    }).compile();

    repository = module.get<PortfolioRepository>(PortfolioRepository);
    ordersRepository = module.get(getRepositoryToken(Order));
    instrumentsRepository = module.get(getRepositoryToken(Instrument));
    marketDataRepository = module.get(getRepositoryToken(MarketData));

    // Mock logger
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Create spies for repository methods
    ordersCreateQueryBuilderSpy = jest.spyOn(
      ordersRepository,
      'createQueryBuilder',
    );
    marketDataCreateQueryBuilderSpy = jest.spyOn(
      marketDataRepository,
      'createQueryBuilder',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPositions', () => {
    const userId = 1;

    it('should return positions successfully', async () => {
      // Arrange
      const mockResult = [
        {
          instrumentId: 1,
          ticker: 'AAPL',
          name: 'Apple Inc.',
          quantity: 10,
          netCashFlow: '1400.00',
        },
      ];
      ordersCreateQueryBuilderSpy.mockReturnValue(
        createMockQueryBuilder(mockResult),
      );

      // Act
      const result = await repository.getPositions(userId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        instrumentId: 1,
        ticker: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        netCashFlow: '1400.00',
      });
      // Optionally, you can check if the query builder was called with the correct parameters
      expect(ordersCreateQueryBuilderSpy).toHaveBeenCalledWith('o');
    });

    it('should handle empty positions', async () => {
      // Arrange
      ordersCreateQueryBuilderSpy.mockReturnValue(createMockQueryBuilder([]));

      // Act
      const result = await repository.getPositions(userId);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('getAvailableCash', () => {
    const userId = 1;

    it('should return available cash successfully', async () => {
      // Arrange
      const mockResult = { cash: '1000.00' };
      ordersCreateQueryBuilderSpy.mockReturnValue(
        createMockQueryBuilder(mockResult),
      );

      // Act
      const result = await repository.getAvailableCash(userId);

      // Assert
      expect(result).toBe('1000.00');
      expect(ordersCreateQueryBuilderSpy).toHaveBeenCalledWith('o');
    });

    it('should handle null result (0)', async () => {
      // Arrange
      ordersCreateQueryBuilderSpy.mockReturnValue(createMockQueryBuilder(null));

      // Act
      const result = await repository.getAvailableCash(userId);

      // Assert
      expect(result).toBe('0');
    });
  });

  describe('getReservedCash', () => {
    const userId = 1;

    it('should return reserved cash successfully', async () => {
      // Arrange
      const mockResult = { reserved: '200.00' };
      ordersCreateQueryBuilderSpy.mockReturnValue(
        createMockQueryBuilder(mockResult),
      );

      // Act
      const result = await repository.getReservedCash(userId);

      // Assert
      expect(result).toBe('200.00');
      expect(ordersCreateQueryBuilderSpy).toHaveBeenCalledWith('o');
    });

    it('should handle null result', async () => {
      // Arrange
      ordersCreateQueryBuilderSpy.mockReturnValue(createMockQueryBuilder(null));

      // Act
      const result = await repository.getReservedCash(userId);

      // Assert
      expect(result).toBe('0');
    });
  });

  describe('getLatestClosePrices', () => {
    const stockIds = [1, 2, 3];

    it('should return latest close prices successfully', async () => {
      // Arrange
      const mockResult = [
        { instrument_id: '1', close: '150.00' },
        { instrument_id: '2', close: '200.00' },
        { instrument_id: '3', close: null },
      ];
      marketDataCreateQueryBuilderSpy.mockReturnValue(
        createMockQueryBuilder(mockResult),
      );

      // Act
      const result = await repository.getLatestClosePrices(stockIds);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ instrumentId: 1, close: '150.00' });
      expect(result[1]).toEqual({ instrumentId: 2, close: '200.00' });
      expect(result[2]).toEqual({ instrumentId: 3, close: null });
      expect(marketDataCreateQueryBuilderSpy).toHaveBeenCalledWith('m2');
      expect(marketDataCreateQueryBuilderSpy).toHaveBeenCalledWith('m');
    });

    it('should handle empty stock IDs array', async () => {
      // Arrange
      marketDataCreateQueryBuilderSpy.mockReturnValue(
        createMockQueryBuilder([]),
      );

      // Act
      const result = await repository.getLatestClosePrices([]);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  // Recommended repository initialization tests
  describe('repository initialization', () => {
    it('should be defined', () => {
      expect(repository).toBeDefined();
    });

    it('should have all repositories injected', () => {
      expect(ordersRepository).toBeDefined();
      expect(instrumentsRepository).toBeDefined();
      expect(marketDataRepository).toBeDefined();
    });
  });
});
