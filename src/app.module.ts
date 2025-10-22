import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { PortfolioService } from './modules/portfolio/portfolio.service';

@Module({
  imports: [
    // Configuration modules
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    // Infrastructure modules
    DatabaseModule,
    // Modules
    // PortfolioModule,
    UsersModule,
    PortfolioModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
