import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PortfolioService } from "./portfolio.service";
import { PortfolioController } from "./portfolio.controller";

@Module({
    imports: [UsersModule],
    controllers: [PortfolioController],
    providers: [PortfolioService],
})
export class PortfolioModule {}
