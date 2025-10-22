import { Controller, Get, HttpCode, HttpException, HttpStatus, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortfolioResult, PortfolioService } from './portfolio.service';
import { ResultCode } from 'src/core/common-types';
import { PortfolioResponseDto, PortfolioRequestDto } from './dto/portfolio.dto';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':userId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get portfolio' })
  @ApiOkResponse({ type: PortfolioResponseDto })
  async getPortfolio(@Param('userId', ParseIntPipe) userId: number): Promise<PortfolioResponseDto> {
    const result = await this.portfolioService.getPortfolio(userId);
    
    switch (result.type) {
      case ResultCode.SUCCESS:
        return result.data;
      case ResultCode.FAILED:
        throw new HttpException(result.message, HttpStatus.CONFLICT);
    }
  }
}