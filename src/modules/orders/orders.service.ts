import { Injectable, Logger } from '@nestjs/common';
import { ResultCode } from '../../core/common-types';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrdersRepository } from 'src/modules/orders/orders.repository';
import { OrderType, OrderSide } from './orders.types';
import { OrderFactory } from './entities/order-factory';

export type SuccessOrderResult = {
  type: ResultCode.SUCCESS;
  data: OrderResponseDto;
};

export type FailedResult = {
  type: ResultCode.FAILED;
  message: string;
};

export type OrderResult = SuccessOrderResult | FailedResult;

export type SuccessPriceResult = {
  type: ResultCode.SUCCESS;
  price: number;
};

export type PriceResult = SuccessPriceResult | FailedResult;

// Metrics for tracking the success and failure of order operations
const CREATE_ORDER_SUCCESS_LOG =
  '[cocos-challenge.orders.create_order.success] create order success';
const CREATE_ORDER_FAILURE_LOG =
  '[cocos-challenge.orders.create_order.failure] create order failure';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly ordersRepository: OrdersRepository) {}

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

      // Calculate price based on order type
      const priceResult = await this.calculateOrderPrice(createOrderDto);
      if (priceResult.type === ResultCode.FAILED) {
        return priceResult;
      }
      const price = priceResult.price;

      // Calculate size based on order type
      const size = this.calculateOrderSize(createOrderDto, price);
      if (!size || size <= 0) {
        return {
          type: ResultCode.FAILED,
          message: `Invalid order size: ${size}, ${price}`,
        };
      }

      // Validate user has sufficient funds/shares
      const validationResult = await this.validateUserHasSufficientResources(
        userId,
        createOrderDto,
        size,
        price,
      );
      if (validationResult.type === ResultCode.FAILED) {
        return validationResult;
      }

      // Create order using factory
      const order = OrderFactory.createOrder({
        userId,
        instrumentId: createOrderDto.instrumentId,
        side: createOrderDto.side,
        type: createOrderDto.type,
        size,
        price: price ? price.toString() : null,
      });

      // Save to database
      const savedOrder = await this.ordersRepository.createOrder({
        userId: order.userId,
        instrumentId: order.instrumentId,
        side: order.side,
        type: order.type,
        size: order.size,
        price: order.price,
        status: order.status,
      });

      this.logger.log({ order: savedOrder }, CREATE_ORDER_SUCCESS_LOG);

      return {
        type: ResultCode.SUCCESS,
        data: new OrderResponseDto(savedOrder),
      };
    } catch (error: unknown) {
      this.logger.error({ error }, CREATE_ORDER_FAILURE_LOG);
      return {
        type: ResultCode.FAILED,
        message: 'Failed to create order',
      };
    }
  }

  /**
   * Validates that the user has sufficient funds or shares to execute the order.
   *
   * For BUY orders: Checks if user has enough cash to cover the total cost (size * price)
   * For SELL orders: Checks if user has enough shares to sell
   *
   * This validation prevents orders from being created when the user doesn't have
   * sufficient resources, which would result in REJECTED orders.
   *
   * @param userId - The user placing the order
   * @param createOrderDto - The order details
   * @param size - Number of shares/units in the order
   * @param price - Price per share/unit
   * @returns OrderResult indicating if validation passed or failed
   */
  private async validateUserHasSufficientResources(
    userId: number,
    createOrderDto: CreateOrderDto,
    size: number,
    price: number | null,
  ): Promise<OrderResult> {
    if (createOrderDto.side === OrderSide.BUY) {
      // Validate user has sufficient cash
      const netCash = await this.ordersRepository.getAvailableCash(userId);
      const reservedCash = await this.ordersRepository.getReservedCash(userId);

      const requiredAmount = size * (price || 0);
      const netCashAmount = parseFloat(netCash);
      const reservedCashAmount = parseFloat(reservedCash);

      // Calculate the available cash after deducting the reserved cash (LIMIT/NEW orders)
      const avalableCash = netCashAmount - reservedCashAmount;

      if (avalableCash < requiredAmount) {
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

  /**
   * Calculates the price for an order based on its type.
   *
   * For MARKET orders: Fetches the current market price from market data
   * For LIMIT orders: Uses the price provided in the order request
   *
   * @param createOrderDto - The order creation request
   * @returns PriceResult with the calculated price or error message
   */
  private async calculateOrderPrice(
    createOrderDto: CreateOrderDto,
  ): Promise<PriceResult> {
    if (createOrderDto.type === OrderType.MARKET) {
      // For MARKET orders, get current price
      const marketData = await this.ordersRepository.getLatestMarketData(
        createOrderDto.instrumentId,
      );

      if (!marketData) {
        return {
          type: ResultCode.FAILED,
          message: 'Market data not available for instrument',
        };
      }

      const price = parseFloat(marketData.close);
      return {
        type: ResultCode.SUCCESS,
        price: price,
      };
    } else {
      // For LIMIT orders, use provided price
      const price = createOrderDto.price!;
      return {
        type: ResultCode.SUCCESS,
        price: price,
      };
    }
  }

  /**
   * Calculates the size for an order based on its type and parameters.
   *
   * For MARKET/LIMIT orders: Calculates size based on amount and price (amount / price)
   * For CASH orders: Uses amount directly (no price calculation needed)
   *
   * @param createOrderDto - The order creation request
   * @param price - The price per unit (not used for cash orders)
   * @returns The calculated size
   */
  private calculateOrderSize(
    createOrderDto: CreateOrderDto,
    price: number | null,
  ): number {
    // For cash orders, size is simply the amount
    if (
      createOrderDto.side === OrderSide.CASH_IN ||
      createOrderDto.side === OrderSide.CASH_OUT
    ) {
      return createOrderDto.amount ?? createOrderDto.size!;
    }

    // For trading orders, calculate size based on amount and price
    if (createOrderDto.amount && price) {
      return Math.floor(createOrderDto.amount / price);
    }

    // Fallback to provided size
    return createOrderDto.size!;
  }
}
