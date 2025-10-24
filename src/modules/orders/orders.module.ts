import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Order } from './entities/order.entity';
import { Instrument } from '../instruments/entities/instrument.entity';
import { MarketData } from '../market-data/entities/market-data.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrdersRepository } from './orders.repository';
import { UsersModule } from '../users/users.module';
import { ValidateUserHeaderPipe } from './pipes/validate-user-header.pipe';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Instrument, MarketData]),
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, ValidateUserHeaderPipe],
  exports: [OrdersService, OrdersRepository, ValidateUserHeaderPipe],
})
export class OrdersModule {}
