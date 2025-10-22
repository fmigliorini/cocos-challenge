import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { ResultCode } from 'src/core/common-types';
import { PortfolioResponseDto } from './dto/portfolio.dto';
import { UserExistsPipe } from '../users/pipes/user-exists.pipe';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get(':userId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get portfolio' })
  @ApiOkResponse({ type: PortfolioResponseDto })
  getPortfolio(
    @Param('userId', ParseIntPipe, UserExistsPipe) userId: number,
  ): PortfolioResponseDto {
    const result = this.portfolioService.getPortfolio(userId);

    switch (result.type) {
      case ResultCode.SUCCESS:
        return result.data;
      case ResultCode.FAILED:
        throw new HttpException(result.message, HttpStatus.CONFLICT);
    }
  }
}
