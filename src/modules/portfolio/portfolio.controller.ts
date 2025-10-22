import { Controller, Get, HttpCode, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Portfolio, PortfolioResult, PortfolioService } from './portfolio.service';
import { ResultCode } from 'src/core/common-types';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':userId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get portfolio' })
  @ApiResponse({ status: 200, description: 'Success' })
  async getPortfolio(@Param('userId') userId: string): Promise<Portfolio> {
    const result = await this.portfolioService.getPortfolio(userId);
    
    switch (result.type) {
      case ResultCode.SUCCESS:
        return result.data;
      case ResultCode.FAILED:
        throw new HttpException(result.message, HttpStatus.CONFLICT);
    }
  }
}