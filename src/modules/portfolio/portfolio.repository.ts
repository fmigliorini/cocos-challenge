import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Instrument } from '../instruments/entities/instrument.entity';
import { MarketData } from '../market-data/entities/market-data.entity';
import { PositionAggRow, PriceRow, MoneyString } from './portfolio.types';

@Injectable()
export class PortfolioRepository {
  private readonly logger = new Logger(PortfolioRepository.name);

  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    // (_) since it is not used in the repository but it is recommended to inject.
    @InjectRepository(Instrument)
    private readonly _instruments: Repository<Instrument>,
    @InjectRepository(MarketData)
    private readonly marketData: Repository<MarketData>,
  ) {}

  /**
   * Positions still open per instrument:
   *  - quantity = Σ(BUY size) - Σ(SELL size)
   *  - netCashFlow = Σ(+SELL size*price) + Σ(-BUY size*price)
   * Filters: FILLED orders only; excludes positions with qty = 0.
   */
  async getPositions(userId: number): Promise<PositionAggRow[]> {
    try {
      // Define reusable quantity calculation to avoid duplication
      const quantityCalculation = `SUM(CASE 
        WHEN o.side = 'BUY' THEN o.size
        WHEN o.side = 'SELL' THEN -o.size
        ELSE 0 END)`;

      const rows = await this.orders
        .createQueryBuilder('o')
        .innerJoin(Instrument, 'i', 'i.id = o.instrumentid')
        .select('o.instrumentid', 'instrumentId')
        .addSelect('i.ticker', 'ticker')
        .addSelect('i.name', 'name')
        .addSelect(`CAST(${quantityCalculation} AS NUMERIC)`, 'quantity')
        .addSelect(
          `CAST(
            SUM(CASE 
              WHEN o.side = 'BUY'  THEN -(o.size * o.price)
              WHEN o.side = 'SELL' THEN  (o.size * o.price)
              ELSE 0 END)
          AS NUMERIC)`,
          'netCashFlow',
        )
        .where('o.userId = :userId', { userId })
        .andWhere('o.status = :status', { status: 'FILLED' })
        .andWhere("o.side IN ('BUY', 'SELL')")
        .groupBy('o.instrumentid, i.ticker, i.name')
        .having(`${quantityCalculation} <> 0`)
        .orderBy('i.ticker', 'ASC')
        .getRawMany<{
          instrumentId: number;
          ticker: string;
          name: string;
          quantity: number;
          netCashFlow: MoneyString;
        }>();

      this.logger.log(rows, 'rows');
      // Normalize types and return
      return rows.map((r) => ({
        instrumentId: r.instrumentId,
        ticker: r.ticker,
        name: r.name,
        quantity: r.quantity,
        netCashFlow: r.netCashFlow,
      }));
    } catch (error) {
      this.logger.error(`Failed to get positions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Latest close per instrument - optimized for large datasets.
   * Uses database-level filtering to get only the latest record per instrument.
   */
  async getLatestClosePrices(instrumentIds: number[]): Promise<PriceRow[]> {
    if (instrumentIds.length === 0) return [];

    // Use a subquery to find the latest date for each instrument
    const subQuery = this.marketData
      .createQueryBuilder('m2')
      .select('m2.instrumentId', 'instrument_id') // id
      .addSelect('MAX(m2.date)', 'maxdate') // last date
      .where('m2.instrumentId IN (:...ids)', { ids: instrumentIds })
      .groupBy('m2.instrumentId');

    // Main query: get the latest record for each instrument
    const query = this.marketData
      .createQueryBuilder('m')
      .select('m.instrumentId', 'instrument_id')
      .addSelect('m.close', 'close')
      .innerJoin(
        `(${subQuery.getQuery()})`,
        'latest',
        'm.instrumentid = latest.instrument_id AND m.date = latest.maxdate',
      )
      .setParameters(subQuery.getParameters())
      .orderBy('m.instrumentid', 'ASC');

    const rows = await query.getRawMany<{
      instrument_id: string;
      close: MoneyString | null;
    }>();

    return rows.map((row) => ({
      instrumentId: Number(row.instrument_id),
      close: row.close,
    }));
  }

  /**
   * Cash you can use right now (FILLED only):
   *   cash = Σ(CASH_IN) - Σ(CASH_OUT) - Σ(BUY) + Σ(SELL)
   */
  async getAvailableCash(userId: number): Promise<MoneyString> {
    const row = await this.orders
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
      .getRawOne<{ cash: MoneyString }>();

    return row?.cash ?? '0';
  }

  /**
   * Cash reserved by OPEN (NEW) orders.
   * By default: only BUY orders reserve cash (SELL reserves shares).
   */
  async getReservedCash(userId: number): Promise<MoneyString> {
    const row = await this.orders
      .createQueryBuilder('o')
      .select(
        `CAST(
          SUM(CASE WHEN o.side = 'BUY' THEN o.size * o.price ELSE 0 END)
        AS NUMERIC)`,
        'reserved',
      )
      .where('o.userId = :userId', { userId })
      .andWhere('o.status = :status', { status: 'NEW' }) // open orders
      .andWhere(`o.side IN ('BUY')`)
      .getRawOne<{ reserved: MoneyString }>();

    return row?.reserved ?? '0';
  }
}
