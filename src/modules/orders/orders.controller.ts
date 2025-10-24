import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService, OrderResult } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { ResultCode } from '../../core/common-types';
import { UserExistsPipe } from '../users/pipes/user-exists.pipe';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':userId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new order',
    description:
      'Submit a buy or sell order for a financial instrument. Supports MARKET orders (immediate execution) and LIMIT orders (execution at specified price).',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid order data or validation errors',
  })
  @ApiResponse({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    description:
      'Order validation failed (insufficient funds, invalid instrument, etc.)',
  })
  async createOrder(
    @Param('userId', ParseIntPipe, UserExistsPipe) userId: number,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    const result: OrderResult = await this.ordersService.createOrder(
      userId,
      createOrderDto,
    );

    switch (result.type) {
      case ResultCode.SUCCESS:
        return result.data;
      case ResultCode.FAILED:
        throw new HttpException(result.message, HttpStatus.CONFLICT);
    }
  }
}
