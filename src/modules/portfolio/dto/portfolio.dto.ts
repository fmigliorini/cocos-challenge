import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsInt,
  Min,
} from 'class-validator';
import { userIdApiProperty } from 'src/core/swagger-decorators';
import { PortfolioDetails, PositiionDetails } from '../portfolio.types';

/**
 * Portfolio Request DTO
 * This class represents the request for the portfolio.
 * It contains the user ID.
 */
export class PortfolioRequestDto {
  @userIdApiProperty()
  @IsInt()
  @Min(1)
  userId: number;
}

/**
 * Portfolio Response DTO
 * This class represents the response for the portfolio.
 * It contains the user ID, available cash, total positions value, and positions.
 */
export class PortfolioResponseDto {
  @userIdApiProperty()
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({
    required: true,
    description: 'The total value',
    example: '1000',
  })
  @IsString()
  @IsNotEmpty()
  totalAccountValue: string;

  @ApiProperty({
    required: true,
    description: 'The available cash',
    example: '1000',
  })
  @IsString()
  @IsNotEmpty()
  availableCash: string;

  @ApiProperty({
    required: true,
    description: 'The positions',
    example: '1000',
  })
  @IsArray()
  @IsNotEmpty()
  positions: PositionDto[];

  constructor(portfolio: PortfolioDetails) {
    this.totalAccountValue = portfolio.totalAccountValue;
    this.availableCash = portfolio.availableCashAfterReserves;
    this.positions = portfolio.positions.map(
      (position) => new PositionDto(position),
    );
  }
}

/**
 * Position DTO
 * This class represents a position in the portfolio.
 * It contains the instrument ID, ticker, name, quantity, market price, market value, average price, and P&L percentage.
 */
export class PositionDto {

  @ApiProperty({
    required: true,
    description: 'The instrument ticker',
    example: 'BTC',
  })
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @ApiProperty({
    required: true,
    description: 'The instrument name',
    example: 'Bitcoin',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: true,
    description: 'The instrument quantity',
    example: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    required: true,
    description: 'The instrument market value',
    example: 100,
  })
  @IsString()
  @IsNotEmpty()
  marketValue: string;

  @ApiProperty({
    required: true,
    description: 'The instrument average cost',
    example: 100,
  })
  @IsString()
  @IsNotEmpty()
  averageCost: string;

  @ApiProperty({
    required: true,
    description: 'The instrument P&L percentage',
    example: 100,
  })
  @IsString()
  @IsNotEmpty()
  pnlPercentage: string;

  constructor(position: PositiionDetails) {
    this.ticker = position.ticker;
    this.name = position.name;
    this.quantity = position.qty;
    this.marketValue = position.positionValue ?? '0.00';
    this.pnlPercentage = position.totalReturnPct ?? '0.00';
  }
}
