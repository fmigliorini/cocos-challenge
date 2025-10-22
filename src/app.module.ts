import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PortfolioController } from './modules/portfolio/portfolio.controller';
import { PortfolioService } from './modules/portfolio/portfolio.service';
import { ConfigModule } from '@nestjs/config';
import { LoggingModule } from './infrastructure/logger/logging.module';

@Module({
  // Load environment variables from .env file
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    // Logging module
    LoggingModule,
  ],
  controllers: [AppController, PortfolioController],
  providers: [AppService, PortfolioService],
})
export class AppModule {}
