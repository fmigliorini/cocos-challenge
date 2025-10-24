import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderType, OrderSide, OrderStatus } from './orders.types';
import { ResultCode } from '../../core/common-types';
import { ValidateUserHeaderPipe } from './pipes/validate-user-header.pipe';
import { UsersRepository } from '../users/users.repository';

describe('OrdersController', () => {
  let sut: OrdersController;
  let ordersService: OrdersService;
  let validateUserHeaderPipe: ValidateUserHeaderPipe;
  let ordersServiceCreateOrderSpy: jest.SpyInstance;
  let validateUserHeaderPipeSpy: jest.SpyInstance;

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
    // create a testing module
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        OrdersService,
        ValidateUserHeaderPipe,
        {
          provide: OrdersRepository,
          useValue: {
            getInstrumentById: jest.fn(),
            getLatestMarketData: jest.fn(),
            getAvailableCash: jest.fn(),
            getAvailableShares: jest.fn(),
            getReservedCash: jest.fn(),
            createOrder: jest.fn(),
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
    sut = module.get<OrdersController>(OrdersController);
    ordersService = module.get<OrdersService>(OrdersService);
    validateUserHeaderPipe = module.get<ValidateUserHeaderPipe>(
      ValidateUserHeaderPipe,
    );

    // Create spies
    ordersServiceCreateOrderSpy = jest.spyOn(ordersService, 'createOrder');
    validateUserHeaderPipeSpy = jest.spyOn(validateUserHeaderPipe, 'transform');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const userId = 1;
    const userIdHeader = '1';
    const createOrderDto: CreateOrderDto = {
      instrumentId: 1,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      amount: 750,
    };

    it('should create order successfully and return order data', async () => {
      // Arrange
      const successResult = {
        type: ResultCode.SUCCESS,
        data: mockOrder,
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(successResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act
      const result = await sut.createOrder(userIdHeader, createOrderDto);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(ordersServiceCreateOrderSpy).toHaveBeenCalledWith(
        userId,
        createOrderDto,
      );
      expect(ordersServiceCreateOrderSpy).toHaveBeenCalledTimes(1);
    });

    it('should throw HttpException when service returns failure', async () => {
      // Arrange
      const failureResult = {
        type: ResultCode.FAILED,
        message: 'Insufficient funds',
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(failureResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act & Assert
      await expect(
        sut.createOrder(userIdHeader, createOrderDto),
      ).rejects.toThrow(
        new HttpException('Insufficient funds', HttpStatus.CONFLICT),
      );

      expect(ordersServiceCreateOrderSpy).toHaveBeenCalledWith(
        userId,
        createOrderDto,
      );
    });

    it('should handle service throwing an error', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      ordersServiceCreateOrderSpy.mockRejectedValue(error);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act & Assert
      await expect(
        sut.createOrder(userIdHeader, createOrderDto),
      ).rejects.toThrow(error);
      expect(ordersServiceCreateOrderSpy).toHaveBeenCalledWith(
        userId,
        createOrderDto,
      );
    });

    it('should handle MARKET order creation', async () => {
      // Arrange
      const marketOrderDto: CreateOrderDto = {
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        amount: 750,
      };
      const successResult = {
        type: ResultCode.SUCCESS,
        data: mockOrder,
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(successResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act
      const result = await sut.createOrder(userIdHeader, marketOrderDto);

      // Assert
      expect(result).toEqual(mockOrder);
      expect(ordersServiceCreateOrderSpy).toHaveBeenCalledWith(
        userId,
        marketOrderDto,
      );
    });

    it('should handle LIMIT order creation', async () => {
      // Arrange
      const limitOrderDto: CreateOrderDto = {
        instrumentId: 1,
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        price: 140.0,
        amount: 700,
      };
      const limitOrder = {
        ...mockOrder,
        type: OrderType.LIMIT,
        status: OrderStatus.NEW,
      };
      const successResult = {
        type: ResultCode.SUCCESS,
        data: limitOrder,
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(successResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act
      const result = await sut.createOrder(userIdHeader, limitOrderDto);

      // Assert
      expect(result).toEqual(limitOrder);
      expect(ordersServiceCreateOrderSpy).toHaveBeenCalledWith(
        userId,
        limitOrderDto,
      );
    });

    it('should handle CASH_IN order creation', async () => {
      // Arrange
      const cashInDto: CreateOrderDto = {
        instrumentId: 1,
        side: OrderSide.CASH_IN,
        type: OrderType.MARKET,
        amount: 500,
      };
      const cashOrder = { ...mockOrder, side: OrderSide.CASH_IN };
      const successResult = {
        type: ResultCode.SUCCESS,
        data: cashOrder,
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(successResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act
      const result = await sut.createOrder(userIdHeader, cashInDto);

      // Assert
      expect(result).toEqual(cashOrder);
      expect(ordersServiceCreateOrderSpy).toHaveBeenCalledWith(
        userId,
        cashInDto,
      );
    });

    it('should handle CASH_OUT order creation', async () => {
      // Arrange
      const cashOutDto: CreateOrderDto = {
        instrumentId: 1,
        side: OrderSide.CASH_OUT,
        type: OrderType.MARKET,
        amount: 200,
      };
      const cashOrder = { ...mockOrder, side: OrderSide.CASH_OUT };
      const successResult = {
        type: ResultCode.SUCCESS,
        data: cashOrder,
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(successResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act
      const result = await sut.createOrder(userIdHeader, cashOutDto);

      // Assert
      expect(result).toEqual(cashOrder);
      expect(ordersServiceCreateOrderSpy).toHaveBeenCalledWith(
        userId,
        cashOutDto,
      );
    });

    it('should handle insufficient funds error', async () => {
      // Arrange
      const failureResult = {
        type: ResultCode.FAILED,
        message: 'Insufficient funds',
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(failureResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act & Assert
      await expect(
        sut.createOrder(userIdHeader, createOrderDto),
      ).rejects.toThrow(HttpException);
    });

    it('should handle insufficient shares error', async () => {
      // Arrange
      const failureResult = {
        type: ResultCode.FAILED,
        message: 'Insufficient shares',
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(failureResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act & Assert
      await expect(
        sut.createOrder(userIdHeader, createOrderDto),
      ).rejects.toThrow(HttpException);
    });

    it('should handle instrument not found error', async () => {
      // Arrange
      const failureResult = {
        type: ResultCode.FAILED,
        message: 'Instrument not found',
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(failureResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act & Assert
      await expect(
        sut.createOrder(userIdHeader, createOrderDto),
      ).rejects.toThrow(HttpException);
    });

    it('should handle market data not available error', async () => {
      // Arrange
      const failureResult = {
        type: ResultCode.FAILED,
        message: 'Market data not available for instrument',
      };
      ordersServiceCreateOrderSpy.mockResolvedValue(failureResult);
      validateUserHeaderPipeSpy.mockResolvedValue(userId);

      // Act & Assert
      await expect(
        sut.createOrder(userIdHeader, createOrderDto),
      ).rejects.toThrow(HttpException);
    });
  });

  // Initialization tests.
  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(sut).toBeDefined();
    });

    it('should have OrdersService injected', () => {
      expect(ordersService).toBeDefined();
    });
  });
});
