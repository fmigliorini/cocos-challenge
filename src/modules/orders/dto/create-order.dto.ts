import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderSide, OrderType } from '../orders.types';

export class CreateOrderDto {
  @ApiProperty({
    description: 'ID of the instrument to trade',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => parseInt(value, 10))
  instrumentId: number;

  @ApiProperty({
    description: 'Order side - whether to buy or sell',
    enum: OrderSide,
    example: OrderSide.BUY,
  })
  @IsEnum(OrderSide)
  side: OrderSide;

  @ApiProperty({
    description:
      'Order type - MARKET orders execute immediately, LIMIT orders wait for price',
    enum: OrderType,
    example: OrderType.MARKET,
  })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiPropertyOptional({
    description:
      'Price for LIMIT orders (required for LIMIT, ignored for MARKET)',
    example: 150.5,
    minimum: 0.01,
    maximum: 999999.99,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  @ValidateIf((o: CreateOrderDto) => o.type === OrderType.LIMIT)
  price?: number;

  @ApiPropertyOptional({
    description:
      'Number of shares to trade (either size or amount must be provided)',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => (value ? parseInt(value) : undefined))
  @ValidateIf((o: CreateOrderDto) => !o.amount)
  size?: number;

  @ApiPropertyOptional({
    description:
      'Total amount in ARS to invest (either size or amount must be provided)',
    example: 1505.0,
    minimum: 0.01,
    maximum: 999999.99,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  @ValidateIf((o: CreateOrderDto) => !o.size)
  amount?: number;
}
