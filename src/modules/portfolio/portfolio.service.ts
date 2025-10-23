import { Injectable, Logger } from '@nestjs/common';
import { ResultCode } from '../../core/common-types';
import { PortfolioResponseDto } from './dto/portfolio.dto';
import { PortfolioRepository } from './portfolio.repository';
import { PositiionDetails, PortfolioDetails } from './portfolio.types';

export type SuccessPortfolioResult = {
  type: ResultCode.SUCCESS;
  data: PortfolioResponseDto;
};

export type FailedPortfolioResult = {
  type: ResultCode.FAILED;
  message: string;
};

export type PortfolioResult = SuccessPortfolioResult | FailedPortfolioResult;

// Metrics for tracking the success and failure of the get portfolio operation
const GET_PORTFOLIO_SUCCESS_LOG =
  '[cocos-challenge.portfolio.get_portfolio.success] get portfolio success';
const GET_PORTFOLIO_FAILURE_LOG =
  '[cocos-challenge.portfolio.get_portfolio.failure] get portfolio failure';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(private readonly portfolioRepository: PortfolioRepository) { }

  async getPortfolio(userId: number): Promise<PortfolioResult> {
    try {
      // Fetch base data
      const [availableCashStr, reservedCashStr, positions] = await Promise.all([
        this.portfolioRepository.getAvailableCash(userId),
        this.portfolioRepository.getReservedCash(userId),
        this.portfolioRepository.getPositions(userId), // PositionAggRow[]
      ]);

      // Prices for instruments in positions
      const instrumentIds = positions.map((p) => p.instrumentId);
      const latestPrices =
        await this.portfolioRepository.getLatestClosePrices(instrumentIds); // PriceRow[]

      // Build price map: instrumentId -> last price
      const priceMap = new Map<number, number | null>(
        latestPrices.map((p) => [
          p.instrumentId,
          p.close == null || p.close === '' ? null : Number(p.close),
        ]),
      );

      // Build holdings with valuation & returns
      let totalPositionsValue = 0;
      const holdingPositions: PositiionDetails[] = positions.map((row) => {
        const instrumentId = row.instrumentId;
        const qty = row.quantity;
        const netCashFlow = Number(row.netCashFlow ?? 0); // could be negative net buyer
        const lastPrice = priceMap.get(instrumentId) ?? null;

        // default position value and return percentage to undefined if no price
        // Edge case: no price for the instrument
        if (!lastPrice) {
          return {
            ticker: row.ticker,
            name: row.name,
            qty,
            positionValue: undefined,
            totalReturnPct: undefined,
          };
        }

        // Calculate position value
        const positionValueNum = qty * lastPrice;
        // Add to total positions value
        totalPositionsValue += positionValueNum;

        // Calculate total return percentage
        let totalReturnPctNum: number | undefined;

        // Return% formula (cost from net cash flow):
        //   netCashFlow = Σ(+SELL) + Σ(-BUY)  => negative if net buyer, positive if net seller
        //   totalReturn% = (positionValue + netCashFlow) / (-netCashFlow) * 100
        if (qty !== 0 && netCashFlow !== 0) {
          const denom = -netCashFlow; // positive for net buyer, negative for net seller
          totalReturnPctNum = ((positionValueNum + netCashFlow) / denom) * 100;
        }

        return {
          ticker: row.ticker,
          name: row.name,
          qty,
          positionValue: positionValueNum?.toFixed(2) ?? undefined,
          totalReturnPct: totalReturnPctNum?.toFixed(2) ?? undefined,
        };
      });

      // Cash math (strings -> numbers -> strings)
      const availableCashNum = Number(availableCashStr ?? 0);
      const reservedCashNum = Number(reservedCashStr ?? 0);
      const availableAfterReservesNum = Math.max(
        availableCashNum - reservedCashNum,
        0,
      );

      const totalAccountValueNum = availableCashNum + totalPositionsValue;

      this.logger.log({ userId }, GET_PORTFOLIO_SUCCESS_LOG);

      const portfolio: PortfolioDetails = {
        availableCashAfterReserves: availableAfterReservesNum.toFixed(2),
        totalAccountValue: totalAccountValueNum.toFixed(2),
        positions: holdingPositions,
      };

      return this.mapResponse(portfolio);
    } catch (error: unknown) {
      this.logger.error({ error, userId }, GET_PORTFOLIO_FAILURE_LOG);
      return {
        type: ResultCode.FAILED,
        message: 'Failed to get portfolio',
      };
    }
  }

  private mapResponse(portfolio: PortfolioDetails): SuccessPortfolioResult {
    return {
      type: ResultCode.SUCCESS,
      data: new PortfolioResponseDto(portfolio),
    };
  }
}
