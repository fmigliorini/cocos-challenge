import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, OrderType, OrderSide } from '../orders.types';

export class OrderResponseDto {
  @ApiProperty({
    description: 'Unique order identifier',
    example: 123,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the instrument traded',
    example: 1,
  })
  instrumentId: number;

  @ApiProperty({
    description: 'ID of the user who placed the order',
    example: 456,
  })
  userId: number;

  @ApiProperty({
    description: 'Number of shares in the order',
    example: 10,
  })
  size: number;

  @ApiProperty({
    description: 'Price per share (null for MARKET orders)',
    example: '150.50',
    nullable: true,
  })
  price: string | null;

  @ApiProperty({
    description: 'Order type',
    enum: OrderType,
    example: OrderType.MARKET,
  })
  type: OrderType;

  @ApiProperty({
    description: 'Order side',
    enum: OrderSide,
    example: OrderSide.BUY,
  })
  side: OrderSide;

  @ApiProperty({
    description: 'Current order status',
    enum: OrderStatus,
    example: OrderStatus.FILLED,
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Order creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  datetime: Date;

  constructor(order: {
    id: number;
    instrumentId: number;
    userId: number;
    size: number;
    price: string | null;
    type: OrderType;
    side: OrderSide;
    status: OrderStatus;
    datetime: Date;
  }) {
    this.id = order.id;
    this.instrumentId = order.instrumentId;
    this.userId = order.userId;
    this.size = order.size;
    this.price = order.price;
    this.type = order.type;
    this.side = order.side;
    this.status = order.status;
    this.datetime = order.datetime;
  }
}
