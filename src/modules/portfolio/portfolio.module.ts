import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PortfolioService } from './portfolio.service';
import { PortfolioController } from './portfolio.controller';
import { PortfolioRepository } from './portfolio.repository';
import { Instrument } from '../instruments/entities/instrument.entity';
import { Order } from '../orders/entities/order.entity';
import { MarketData } from '../market-data/entities/market-data.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Instrument, MarketData, Order])],
  controllers: [PortfolioController],
  providers: [PortfolioService, PortfolioRepository],
})
export class PortfolioModule {}
