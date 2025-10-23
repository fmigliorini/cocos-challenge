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
const GET_PORTFOLIO_SUCCESS_LOG = '[cocos-challenge.portfolio.get_portfolio.success] get portfolio success';
const GET_PORTFOLIO_FAILURE_LOG = '[cocos-challenge.portfolio.get_portfolio.failure] get portfolio failure';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(private readonly portfolioRepository: PortfolioRepository) { }

  async getPortfolio(userId: number): Promise<PortfolioResult> {
    try {
      // Fetch user's account data
      const [availableCashString, reservedCashString, userPositions] = await Promise.all([
        this.portfolioRepository.getAvailableCash(userId),
        this.portfolioRepository.getReservedCash(userId),
        this.portfolioRepository.getPositions(userId), // PositionAggRow[]
      ]);

      // Get current prices for all stocks the user owns
      const stockIds = userPositions.map(p => p.instrumentId);
      const currentStockPrices = await this.portfolioRepository.getLatestClosePrices(stockIds); // PriceRow[]

      // Create a map of stock ID to current price
      const stockPriceMap = new Map<number, number | null>(
        currentStockPrices.map(p => [p.instrumentId, p.close == null || p.close === '' ? null : Number(p.close)]),
      );

      // Calculate the value of each stock position and returns
      let totalStockValue = 0;
      const userStockPositions: PositiionDetails[] = userPositions.map(position => {
        const stockId = position.instrumentId; // instrumentId of the stock
        const sharesOwned = position.quantity; // quantity of shares owned
        const totalMoneyInvested = Number(position.netCashFlow ?? 0); // key: negative means user bought more than sold
        const currentStockPrice = stockPriceMap.get(stockId) ?? null; // value: current price of the stock

        // If we don't have a current price for this stock, we can't calculate its value
        if (!currentStockPrice) {
          return {
            ticker: position.ticker,
            name: position.name,
            qty: sharesOwned,
            positionValue: undefined,
            totalReturnPct: undefined,
          };
        }

        // Calculate how much this stock position is worth now
        const currentPositionValue = sharesOwned * currentStockPrice;
        // Add to total value of all stocks
        totalStockValue += currentPositionValue;

        // Calculate how much profit or loss this stock has made
        let profitLossPercentage: number | undefined;

        /**
         * Calculate return percentage: (current value - money invested) / money invested * 100
         * If the user didn't buy or sell any shares, return percentage is undefined.
         *
         * Why this check is needed?
         * We need both conditions to calculate a meaningful return percentage:
         * 1. sharesOwned !== 0: User must have some position (positive or negative shares)
         * 2. totalMoneyInvested !== 0: User must have some investment history to compare against
         *
         * Note: Users can have negative shares (short positions) in this system.
         *
         * Why totalMoneyInvested is not 0?
         * Because the total money invested is the sum of all the money invested in the stock.
         * If totalMoneyInvested is 0, it means the user's net cash flow is zero (bought and sold the same amount).
         * We can't calculate a meaningful return percentage because we would be dividing by zero.
         * The return percentage would be infinite or undefined, so we skip the calculation.
         */
        if (sharesOwned !== 0 && totalMoneyInvested !== 0) {
          /**
           * We use Math.abs() to get the absolute value of totalMoneyInvested for the calculation.
           * This ensures the denominator is always positive, regardless of the sign.
           *
           * Case 1: totalMoneyInvested is positive (user sold more than bought)
           * Math.abs(+$500) = $500
           *
           * Case 2: totalMoneyInvested is negative (user bought more than sold)
           * Math.abs(-$500) = $500
           */
          const totalMoneyInvestedAbsolute = Math.abs(totalMoneyInvested); // always positive for calculation
          profitLossPercentage = ((currentPositionValue + totalMoneyInvested) / totalMoneyInvestedAbsolute) * 100;
        }

        return {
          ticker: position.ticker,
          name: position.name,
          qty: sharesOwned,
          positionValue: currentPositionValue?.toFixed(2) ?? undefined,
          totalReturnPct: profitLossPercentage?.toFixed(2) ?? undefined,
        };
      });

      // Calculate cash amounts (convert from strings to numbers)
      const availableCashAmount = Number(availableCashString ?? 0);
      const reservedCashAmount = Number(reservedCashString ?? 0);
      const spendableCashAmount = Math.max(availableCashAmount - reservedCashAmount, 0);

      const totalAccountValue = availableCashAmount + totalStockValue;

      this.logger.log({ userId }, GET_PORTFOLIO_SUCCESS_LOG);

      const portfolio: PortfolioDetails = {
        availableCashAfterReserves: spendableCashAmount.toFixed(2),
        totalAccountValue: totalAccountValue.toFixed(2),
        positions: userStockPositions,
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
