import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortfolioRepository } from './portfolio.repository';
import { ResultCode } from '../../core/common-types';
import { PortfolioResponseDto } from './dto/portfolio.dto';
import { UserExistsPipe } from '../users/pipes/user-exists.pipe';
import { UsersRepository } from '../users/users.repository';

describe('PortfolioController', () => {
  let sut: PortfolioController;
  let portfolioService: PortfolioService;
  let userExistsPipe: UserExistsPipe;
  let portfolioServiceGetPortfolioSpy: jest.SpyInstance;
  let userExistsPipeTransformSpy: jest.SpyInstance;

  const mockPortfolioResponse: PortfolioResponseDto = {
    userId: 1,
    totalAccountValue: '10000.00',
    availableCash: '5000.00',
    positions: [
      {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        quantity: 10,
        marketValue: '1500.00',
        averageCost: '1400.00',
        pnlPercentage: '7.14',
      },
    ],
  };

  beforeEach(async () => {
    // create a testing module
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PortfolioController],
      providers: [
        PortfolioService,
        UserExistsPipe,
        {
          provide: PortfolioRepository,
          useValue: {
            getAvailableCash: jest.fn(),
            getReservedCash: jest.fn(),
            getPositions: jest.fn(),
            getLatestClosePrices: jest.fn(),
          },
        },
        {
          provide: UsersRepository,
          useValue: {
            existsById: jest.fn(),
          },
        },
      ],
    }).compile();

    // get the controller and services from the module
    sut = module.get<PortfolioController>(PortfolioController);
    portfolioService = module.get<PortfolioService>(PortfolioService);
    userExistsPipe = module.get<UserExistsPipe>(UserExistsPipe);

    // Create spies
    portfolioServiceGetPortfolioSpy = jest.spyOn(
      portfolioService,
      'getPortfolio',
    );
    userExistsPipeTransformSpy = jest.spyOn(userExistsPipe, 'transform');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // getPortfolio operation
  describe('getPortfolio', () => {
    const userId = 1;

    it('should return portfolio data when service returns success', async () => {
      // Arrange
      const successResult = {
        type: ResultCode.SUCCESS as const,
        data: mockPortfolioResponse,
      };
      portfolioServiceGetPortfolioSpy.mockResolvedValue(successResult);
      userExistsPipeTransformSpy.mockResolvedValue(userId);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result).toEqual(mockPortfolioResponse);
      expect(portfolioServiceGetPortfolioSpy).toHaveBeenCalledWith(userId);
      expect(portfolioServiceGetPortfolioSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException when service returns failure', async () => {
      // Arrange
      const failureResult = {
        type: ResultCode.FAILED as const,
        message: 'Failed to get portfolio',
      };
      portfolioServiceGetPortfolioSpy.mockResolvedValue(failureResult);
      userExistsPipeTransformSpy.mockResolvedValue(userId);

      // Act & Assert
      await expect(sut.getPortfolio(userId)).rejects.toThrow(
        new HttpException('Failed to get portfolio', HttpStatus.CONFLICT),
      );

      expect(portfolioServiceGetPortfolioSpy).toHaveBeenCalledWith(userId);
    });

    it('should handle service throwing an error', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      portfolioServiceGetPortfolioSpy.mockRejectedValue(error);
      userExistsPipeTransformSpy.mockResolvedValue(userId);

      // Act & Assert
      await expect(sut.getPortfolio(userId)).rejects.toThrow(error);
      expect(portfolioServiceGetPortfolioSpy).toHaveBeenCalledWith(userId);
    });

    it('should handle portfolio with multiple positions', async () => {
      // Arrange
      const multiPositionResponse: PortfolioResponseDto = {
        userId: 1,
        totalAccountValue: '15000.00',
        availableCash: '5000.00',
        positions: [
          {
            ticker: 'AAPL',
            name: 'Apple Inc.',
            quantity: 10,
            marketValue: '1500.00',
            averageCost: '1400.00',
            pnlPercentage: '7.14',
          },
          {
            ticker: 'GOOGL',
            name: 'Alphabet Inc.',
            quantity: 5,
            marketValue: '8000.00',
            averageCost: '7500.00',
            pnlPercentage: '6.67',
          },
        ],
      };
      const successResult = {
        type: ResultCode.SUCCESS as const,
        data: multiPositionResponse,
      };
      portfolioServiceGetPortfolioSpy.mockResolvedValue(successResult);
      userExistsPipeTransformSpy.mockResolvedValue(userId);

      // Act
      const result = await sut.getPortfolio(userId);

      // Assert
      expect(result).toEqual(multiPositionResponse);
      expect(result.positions).toHaveLength(2);
    });
  });

  // recommended controller initialization tests
  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(sut).toBeDefined();
    });

    it('should have PortfolioService injected', () => {
      expect(portfolioService).toBeDefined();
    });
  });
});
