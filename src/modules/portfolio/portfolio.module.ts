import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PortfolioService } from "./portfolio.service";
import { PortfolioController } from "./portfolio.controller";
import { LoggingModule } from "src/infrastructure/logger/logging.module";

@Module({
    imports: [LoggingModule, UsersModule],
    controllers: [PortfolioController],
    providers: [PortfolioService],
    exports: [PortfolioService, LoggingModule],
})
export class PortfolioModule {}
