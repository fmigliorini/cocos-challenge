import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { LoggingModule } from './infrastructure/logger/logging.module';
import { OrdersModule } from './modules/orders/orders.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import { InstrumentsModule } from './modules/instruments/instruments.module';

@Module({
  imports: [
    // Configuration modules
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    // Infrastructure modules
    DatabaseModule,
    LoggingModule,
    // Modules
    UsersModule,
    PortfolioModule,
    OrdersModule,
    MarketDataModule,
    InstrumentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
