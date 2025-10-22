import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { databaseConfig } from "./database.config";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Global()
@Module({
  imports: [TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: databaseConfig,
    inject: [ConfigService],
  })],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}