import { Module } from '@nestjs/common';
import { Users } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { UserExistsPipe } from './pipes/user-exists.pipe';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingModule } from 'src/infrastructure/logger/logging.module';

@Module({
    imports: [TypeOrmModule.forFeature([Users]), LoggingModule],
    providers: [UsersRepository, UserExistsPipe],
    exports: [UsersRepository, UserExistsPipe, LoggingModule],
})
export class UsersModule {}
