import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { MarketData } from './entities/market-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MarketData])],
  providers: [],
  exports: [],
})
export class MarketDataModule {}
