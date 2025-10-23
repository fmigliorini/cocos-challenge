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
  };
};
