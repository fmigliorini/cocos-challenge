import { Injectable } from '@nestjs/common';
import { ResultCode } from '../../core/common-types';
import { PortfolioResponseDto } from './dto/portfolio.dto';

export type SuccessPortfolioResult = {
  type: ResultCode.SUCCESS;
  data: PortfolioResponseDto;
};

export type FailedPortfolioResult = {
  type: ResultCode.FAILED;
  message: string;
};

export type PortfolioResult = SuccessPortfolioResult | FailedPortfolioResult;

@Injectable()
export class PortfolioService {
  async getPortfolio(userId: number): Promise<PortfolioResult> {
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
  }
}
