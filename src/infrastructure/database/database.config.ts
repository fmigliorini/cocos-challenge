import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const databaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: configService.get<boolean>('DATABASE_SYNCHRONIZE'),
    logging: configService.get<boolean>('DATABASE_LOGGING'),
    // SSL configuration for secure connections
    // Database provided by Cocos contains SSL but locally is not required :)
    ssl: configService.get<boolean>('DATABASE_SSL'),
  };
};
