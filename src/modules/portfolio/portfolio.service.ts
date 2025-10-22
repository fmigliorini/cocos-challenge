import { Injectable, Logger } from '@nestjs/common';
import { ResultCode } from '../../core/common-types';
import { PortfolioResponseDto } from './dto/portfolio.dto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

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
  private  readonly  logger  =  new  Logger ( PortfolioService.name ) ;

  async getPortfolio(userId: number): Promise<PortfolioResult> {
    try {
      this.logger.log({ userId }, GET_PORTFOLIO_SUCCESS_LOG);
      return {
        type: ResultCode.SUCCESS,
        data: {
          userId,
          availableCash: '500',
          totalPositionsValue: '20000',
          positions: [
            {
              instrumentId: '1',
              ticker: 'BTC',
              name: 'Bitcoin',
              quantity: 1,
              marketPrice: 10000,
              marketValue: 10000,
              averagePrice: 10000,
              pnlPercentage: 0,
              dailyReturnPercent: 0,
            },
            {
              instrumentId: '2',
              ticker: 'ETH',
              name: 'Ethereum',
              quantity: 1,
              marketPrice: 1000,
              marketValue: 1000,
              averagePrice: 1000,
              pnlPercentage: 0,
              dailyReturnPercent: 0,
            },
          ],
        },
      };  
    } catch (error) {
      this.logger.error({ error }, GET_PORTFOLIO_FAILURE_LOG);
      return {
        type: ResultCode.FAILED,
        message: 'Failed to get portfolio',
      };
    }
    
  }
}
