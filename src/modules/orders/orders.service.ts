import { Injectable, Logger } from '@nestjs/common';
import { ResultCode } from '../../core/common-types';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersRepository } from 'src/modules/orders/orders.repository';
import { OrderStatus, OrderType, OrderSide } from './orders.types';

export type SuccessOrderResult = {
  type: ResultCode.SUCCESS;
  data: OrderResponseDto;
};

export type FailedOrderResult = {
  type: ResultCode.FAILED;
  message: string;
};

export type OrderResult = SuccessOrderResult | FailedOrderResult;

// Metrics for tracking the success and failure of order operations
const CREATE_ORDER_SUCCESS_LOG =
  '[cocos-challenge.orders.create_order.success] create order success';
const CREATE_ORDER_FAILURE_LOG =
  '[cocos-challenge.orders.create_order.failure] create order failure';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly ordersRepository: OrdersRepository) { }

  async createOrder(
    userId: number,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderResult> {
    try {
      // Validate instrument exists
      const instrument = await this.ordersRepository.getInstrumentById(
        createOrderDto.instrumentId,
      );

      if (!instrument) {
        return {
          type: ResultCode.FAILED,
          message: 'Instrument not found',
        };
      }

      // Calculate order size and price
      const { size, price } = await this.calculateOrderDetails(
        userId,
        createOrderDto,
      );

      if (!size || size <= 0) {
        return {
          type: ResultCode.FAILED,
          message: 'Invalid order size',
        };
      }

      // Validate user has sufficient funds/shares
      const validationResult = await this.validateOrder(
        userId,
        createOrderDto,
        size,
        price,
      );
      if (validationResult.type === ResultCode.FAILED) {
        return validationResult;
      }

      // Create order
      const order = await this.ordersRepository.createOrder({
        userId,
        instrumentId: createOrderDto.instrumentId,
        side: createOrderDto.side,
        type: createOrderDto.type,
        size,
        price: price ? price.toString() : null,
        status:
          createOrderDto.type === OrderType.MARKET
            ? OrderStatus.FILLED
            : OrderStatus.NEW,
      });

      this.logger.log({ order }, CREATE_ORDER_SUCCESS_LOG);

      return {
        type: ResultCode.SUCCESS,
        data: new OrderResponseDto(order),
      };
    } catch (error: unknown) {
      this.logger.error({ error }, CREATE_ORDER_FAILURE_LOG);
      return {
        type: ResultCode.FAILED,
        message: 'Failed to create order',
      };
    }
  }

  private async calculateOrderDetails(
    _userId: number,
    createOrderDto: CreateOrderDto,
  ): Promise<{ size: number; price: number | null }> {
    let size: number;
    let price: number | null = null;

    if (createOrderDto.type === OrderType.MARKET) {
      // For MARKET orders, get current price
      const marketData = await this.ordersRepository.getLatestMarketData(
        createOrderDto.instrumentId,
      );

      if (!marketData) {
        throw new Error('Market data not available for instrument');
      }

      price = parseFloat(marketData.close);

      // Calculate size based on amount or use provided size
      if (createOrderDto.amount) {
        size = Math.floor(createOrderDto.amount / price);
      } else {
        size = createOrderDto.size!;
      }
    } else {
      // For LIMIT orders, use provided price
      price = createOrderDto.price!;

      // Calculate size based on amount or use provided size
      if (createOrderDto.amount) {
        size = Math.floor(createOrderDto.amount / price);
      } else {
        size = createOrderDto.size!;
      }
    }

    return { size, price };
  }

  private async validateOrder(
    userId: number,
    createOrderDto: CreateOrderDto,
    size: number,
    price: number | null,
  ): Promise<OrderResult> {
    if (createOrderDto.side === OrderSide.BUY) {
      // Validate user has sufficient cash
      const availableCash =
        await this.ordersRepository.getAvailableCash(userId);

      const requiredAmount = size * (price || 0);
      const availableCashAmount = parseFloat(availableCash);

      if (availableCashAmount < requiredAmount) {
        return {
          type: ResultCode.FAILED,
          message: 'Insufficient funds',
        };
      }
    } else if (createOrderDto.side === OrderSide.SELL) {
      // Validate user has sufficient shares
      const availableShares = await this.ordersRepository.getAvailableShares(
        userId,
        createOrderDto.instrumentId,
      );

      if (availableShares < size) {
        return {
          type: ResultCode.FAILED,
          message: 'Insufficient shares',
        };
      }
    }

    return {
      type: ResultCode.SUCCESS,
      data: null as unknown as OrderResponseDto, // This won't be used
    };
  }
}
