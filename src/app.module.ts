import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PortfolioController } from './modules/portfolio/portfolio.controller';
import { PortfolioService } from './modules/portfolio/portfolio.service';

@Module({
  imports: [],
  controllers: [AppController, PortfolioController],
  providers: [AppService, PortfolioService],
})
export class AppModule {}
