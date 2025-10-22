import { Module } from '@nestjs/common';
import { Users } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { UserExistsPipe } from './pipes/user-exists.pipe';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Users])],
  providers: [UsersRepository, UserExistsPipe],
  exports: [UsersRepository, UserExistsPipe],
})
export class UsersModule {}
