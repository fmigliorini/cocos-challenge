import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './portfolio.repository';
import { ResultCode } from '../../core/common-types';
import { PortfolioResponseDto } from './dto/portfolio.dto';
import { PositionAggRow, PriceRow } from './portfolio.types';

describe('PortfolioService', () => {
  let sut: PortfolioService;
  let portfolioRepository: jest.Mocked<PortfolioRepository>;
  let loggerSpy: jest.SpyInstance;
  let getPortfolioSpy: jest.SpyInstance;
  let getAvailableCashSpy: jest.SpyInstance;
  let getReservedCashSpy: jest.SpyInstance;
  let getPositionsSpy: jest.SpyInstance;
  let getLatestClosePricesSpy: jest.SpyInstance;

  const mockPositionAggRow: PositionAggRow = {
    instrumentId: 1,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    quantity: 10,
    netCashFlow: '1400.00',
  };

  const mockPriceRow: PriceRow = {
    instrumentId: 1,
    close: '150.00',
  };

  beforeEach(async () => {
    const mockPortfolioRepository = {
      getAvailableCash: jest.fn(),
      getReservedCash: jest.fn(),
      getPositions: jest.fn(),
      getLatestClosePrices: jest.fn(),
    };

    // create a testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        {
          provide: PortfolioRepository,
          useValue: mockPortfolioRepository,
        },
      ],
    }).compile();

    // get the service and repository from the module
    sut = module.get<PortfolioService>(PortfolioService);
    portfolioRepository = module.get(PortfolioRepository);

    // Mock logger
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    // Create spies on the service method and repository methods
    getPortfolioSpy = jest.spyOn(sut, 'getPortfolio');
    getAvailableCashSpy = jest.spyOn(portfolioRepository, 'getAvailableCash');
    getReservedCashSpy = jest.spyOn(portfolioRepository, 'getReservedCash');
    getPositionsSpy = jest.spyOn(portfolioRepository, 'getPositions');
    getLatestClosePricesSpy = jest.spyOn(
      portfolioRepository,
      'getLatestClosePrices',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPortfolio', () => {
    const userId = 1;

    it('should return portfolio data successfully', async () => {
      // Arrange
      portfolioRepository.getAvailableCash.mockResolvedValue('10000.00');
      portfolioRepository.getReservedCash.mockResolvedValue('5000.00');
      portfolioRepository.getPositions.mockResolvedValue([mockPositionAggRow]);
      portfolioRepository.getLatestClosePrices.mockResolvedValue([
        mockPriceRow,
      ]);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result.type).toBe(ResultCode.SUCCESS);
      if (result.type === ResultCode.SUCCESS) {
        expect(result.data).toBeInstanceOf(PortfolioResponseDto);
        expect(result.data.totalAccountValue).toBe('11500.00'); // 10000 + 1500 (position value)
        expect(result.data.availableCash).toBe('5000.00');
        expect(result.data.positions).toHaveLength(1);
      }
      expect(loggerSpy).toHaveBeenCalledWith(
        { userId },
        '[cocos-challenge.portfolio.get_portfolio.success] get portfolio success',
      );
    });

    it('should handle empty positions', async () => {
      // Arrange
      portfolioRepository.getAvailableCash.mockResolvedValue('1000.00');
      portfolioRepository.getReservedCash.mockResolvedValue('0.00');
      portfolioRepository.getPositions.mockResolvedValue([]);
      portfolioRepository.getLatestClosePrices.mockResolvedValue([]);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result.type).toBe(ResultCode.SUCCESS);
      if (result.type === ResultCode.SUCCESS) {
        expect(result.data.positions).toHaveLength(0);
        expect(result.data.totalAccountValue).toBe('1000.00');
        expect(result.data.availableCash).toBe('1000.00');
      }
    });

    // Edge case: cover the case where the price is not found for a position
    it('should handle positions with missing prices', async () => {
      // Arrange
      portfolioRepository.getAvailableCash.mockResolvedValue('1000.00');
      portfolioRepository.getReservedCash.mockResolvedValue('0.00');
      portfolioRepository.getPositions.mockResolvedValue([mockPositionAggRow]);
      portfolioRepository.getLatestClosePrices.mockResolvedValue([
        { instrumentId: 1, close: null },
      ]);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result.type).toBe(ResultCode.SUCCESS);
      if (result.type === ResultCode.SUCCESS) {
        expect(result.data.positions[0].marketValue).toBe('0.00');
        expect(result.data.positions[0].pnlPercentage).toBe('0.00');
      }
    });

    // Key test: cover the case where the position has a profit
    it('should calculate correct position values and returns', async () => {
      // Arrange
      const positionWithProfit: PositionAggRow = {
        instrumentId: 1,
        ticker: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        netCashFlow: '-1400.00', // User bought for $1400
      };
      const priceWithProfit: PriceRow = {
        instrumentId: 1,
        close: '150.00', // Current price $150
      };

      portfolioRepository.getAvailableCash.mockResolvedValue('1000.00');
      portfolioRepository.getReservedCash.mockResolvedValue('0.00');
      portfolioRepository.getPositions.mockResolvedValue([positionWithProfit]);
      portfolioRepository.getLatestClosePrices.mockResolvedValue([
        priceWithProfit,
      ]);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result.type).toBe(ResultCode.SUCCESS);
      if (result.type === ResultCode.SUCCESS) {
        expect(result.data.positions[0].marketValue).toBe('1500.00');
        expect(result.data.positions[0].pnlPercentage).toBe('7.14'); // (1500 - 1400) / 1400 * 100
      }
    });

    /** Edge case: cover the case where the position is a short position (negative quantity)
     * Side note: the challenge mentions that an order should not be allowed to be allowed
     * to be executed if the user does not have enough cash to cover the order.
     * Why? Current Database example have a case where the user can sell more than they own.
     */
    it('should handle negative positions (short selling)', async () => {
      // Arrange
      const shortPosition: PositionAggRow = {
        instrumentId: 1,
        ticker: 'TSLA',
        name: 'Tesla Inc.',
        quantity: -5, // Short position
        netCashFlow: '1000.00', // User sold for $1000
      };
      const priceRow: PriceRow = {
        instrumentId: 1,
        close: '200.00', // Current price $200
      };

      portfolioRepository.getAvailableCash.mockResolvedValue('1000.00');
      portfolioRepository.getReservedCash.mockResolvedValue('0.00');
      portfolioRepository.getPositions.mockResolvedValue([shortPosition]);
      portfolioRepository.getLatestClosePrices.mockResolvedValue([priceRow]);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result.type).toBe(ResultCode.SUCCESS);
      if (result.type === ResultCode.SUCCESS) {
        expect(result.data.positions[0].quantity).toBe(-5);
        // Market value is negative because the position is a short position
        expect(result.data.positions[0].marketValue).toBe('-1000.00'); // -5 * 200
        // PNL percentage is 0 because the position is a short position
        expect(result.data.positions[0].pnlPercentage).toBe('0.00'); // (1000 - 1000) / 1000 * 100 = 0
      }
    });

    // Edge case: cover the case where the position has no net cash flow
    it('should handle zero net cash flow positions', async () => {
      // Arrange
      const zeroCashFlowPosition: PositionAggRow = {
        instrumentId: 1,
        ticker: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        netCashFlow: '0.00', // No net cash flow
      };
      const priceRow: PriceRow = {
        instrumentId: 1,
        close: '150.00',
      };

      portfolioRepository.getAvailableCash.mockResolvedValue('1000.00');
      portfolioRepository.getReservedCash.mockResolvedValue('0.00');
      portfolioRepository.getPositions.mockResolvedValue([
        zeroCashFlowPosition,
      ]);
      portfolioRepository.getLatestClosePrices.mockResolvedValue([priceRow]);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result.type).toBe(ResultCode.SUCCESS);
      if (result.type === ResultCode.SUCCESS) {
        expect(result.data.positions[0].marketValue).toBe('1500.00');
        expect(result.data.positions[0].pnlPercentage).toBe('0.00'); // No return calculation for zero cash flow
      }
    });

    it('should handle reserved cash correctly', async () => {
      // Arrange
      portfolioRepository.getAvailableCash.mockResolvedValue('1000.00');
      portfolioRepository.getReservedCash.mockResolvedValue('200.00');
      portfolioRepository.getPositions.mockResolvedValue([]);
      portfolioRepository.getLatestClosePrices.mockResolvedValue([]);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result.type).toBe(ResultCode.SUCCESS);
      if (result.type === ResultCode.SUCCESS) {
        expect(result.data.availableCash).toBe('800.00'); // 1000 - 200
      }
    });

    // Edge case: cover the case where the repository throws an error
    it('should return failure result when repository throws error', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      portfolioRepository.getAvailableCash.mockRejectedValue(error);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result.type).toBe(ResultCode.FAILED);
      if (result.type === ResultCode.FAILED) {
        expect(result.message).toBe('Failed to get portfolio');
      }
    });

    it('should call all repository methods with correct parameters', async () => {
      // Arrange
      getAvailableCashSpy.mockResolvedValue('1000.00');
      getReservedCashSpy.mockResolvedValue('0.00');
      getPositionsSpy.mockResolvedValue([]);
      getLatestClosePricesSpy.mockResolvedValue([]);

      // Act
      await sut.getPortfolio(userId);

      // Assert
      expect(getAvailableCashSpy).toHaveBeenCalledWith(userId);
      expect(getReservedCashSpy).toHaveBeenCalledWith(userId);
      expect(getPositionsSpy).toHaveBeenCalledWith(userId);
      expect(getLatestClosePricesSpy).toHaveBeenCalledWith([]);
    });

    it('should call getPortfolio spy correctly', async () => {
      // Arrange
      getAvailableCashSpy.mockResolvedValue('1000.00');
      getReservedCashSpy.mockResolvedValue('0.00');
      getPositionsSpy.mockResolvedValue([]);
      getLatestClosePricesSpy.mockResolvedValue([]);

      // Act
      await sut.getPortfolio(userId);

      // Assert
      expect(getPortfolioSpy).toHaveBeenCalledWith(userId);
      expect(getPortfolioSpy).toHaveBeenCalledTimes(1);
    });
  });

  // recommended service initialization tests
  describe('service initialization', () => {
    it('should be defined', () => {
      expect(sut).toBeDefined();
    });

    it('should have PortfolioRepository injected', () => {
      expect(portfolioRepository).toBeDefined();
    });
  });
});
