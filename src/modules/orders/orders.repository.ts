import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus, OrderType, OrderSide } from './orders.types';
import { Instrument } from '../instruments/entities/instrument.entity';
import { MarketData } from '../market-data/entities/market-data.entity';

export interface CreateOrderData {
  userId: number;
  instrumentId: number;
  side: OrderSide;
  type: OrderType;
  size: number;
  price: string | null;
  status: OrderStatus;
}

@Injectable()
export class OrdersRepository {
  private readonly logger = new Logger(OrdersRepository.name);

  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Instrument)
    private readonly instruments: Repository<Instrument>,
    @InjectRepository(MarketData)
    private readonly marketData: Repository<MarketData>,
  ) {}

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const order = this.orders.create(orderData);
    return await this.orders.save(order);
  }

  async getInstrumentById(instrumentId: number): Promise<Instrument | null> {
    return await this.instruments.findOne({
      where: { id: instrumentId },
    });
  }

  async getLatestMarketData(instrumentId: number): Promise<MarketData | null> {
    return await this.marketData.findOne({
      where: { instrument: { id: instrumentId } },
      order: { date: 'DESC' },
    });
  }

  /**
   * Get available cash for user (FILLED orders only)
   * Note: this function is repeated by the portfolio service
   * @TODO: Move to user repository or create cash repository?
   */
  async getAvailableCash(userId: number): Promise<string> {
    const result = await this.orders
      .createQueryBuilder('o')
      .select(
        `CAST(
          SUM(CASE WHEN o.side = 'CASH_IN'  THEN o.size * o.price ELSE 0 END) +
          SUM(CASE WHEN o.side = 'SELL'     THEN o.size * o.price ELSE 0 END) -
          SUM(CASE WHEN o.side = 'BUY'      THEN o.size * o.price ELSE 0 END) -
          SUM(CASE WHEN o.side = 'CASH_OUT' THEN o.size * o.price ELSE 0 END)
        AS NUMERIC)`,
        'cash',
      )
      .where('o.userId = :userId', { userId })
      .andWhere('o.status = :status', { status: 'FILLED' })
      .getRawOne<{ cash: string }>();

    return result?.cash ?? '0';
  }

  /**
   * Get available shares for user (FILLED orders only)
   */
  async getAvailableShares(
    userId: number,
    instrumentId: number,
  ): Promise<number> {
    const result = await this.orders
      .createQueryBuilder('o')
      .select(
        `CAST(
          SUM(CASE WHEN o.side = 'BUY' THEN o.size ELSE 0 END) -
          SUM(CASE WHEN o.side = 'SELL' THEN o.size ELSE 0 END)
        AS NUMERIC)`,
        'shares',
      )
      .where('o.userId = :userId', { userId })
      .andWhere('o.instrumentId = :instrumentId', { instrumentId })
      .andWhere('o.status = :status', { status: 'FILLED' })
      .andWhere("o.side IN ('BUY', 'SELL')")
      .getRawOne<{ shares: number }>();

    return result?.shares ?? 0;
  }

  /**
   * Get reserved cash for user (NEW orders only)
   */
  async getReservedCash(userId: number): Promise<string> {
    const result = await this.orders
      .createQueryBuilder('o')
      .select(
        `CAST(
          SUM(CASE WHEN o.side = 'BUY' THEN o.size * o.price ELSE 0 END)
        AS NUMERIC)`,
        'reserved',
      )
      .where('o.userId = :userId', { userId })
      .andWhere('o.status = :status', { status: 'NEW' })
      .andWhere("o.side IN ('BUY')")
      .getRawOne<{ reserved: string }>();

    return result?.reserved ?? '0';
  }

  /**
   * Get reserved shares for user (NEW orders only)
   */
  async getReservedShares(
    userId: number,
    instrumentId: number,
  ): Promise<number> {
    const result = await this.orders
      .createQueryBuilder('o')
      .select(
        `CAST(
          SUM(CASE WHEN o.side = 'SELL' THEN o.size ELSE 0 END)
        AS NUMERIC)`,
        'reserved',
      )
      .where('o.userId = :userId', { userId })
      .andWhere('o.instrumentId = :instrumentId', { instrumentId })
      .andWhere('o.status = :status', { status: 'NEW' })
      .andWhere("o.side IN ('SELL')")
      .getRawOne<{ reserved: number }>();

    return result?.reserved ?? 0;
  }
}
