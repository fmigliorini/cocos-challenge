import { Injectable } from '@nestjs/common';
import { Users } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
  ) {}

  /**
   * Checks if a user exists by their ID.
   *
   * @param id - The ID of the user to check.
   * @returns True if the user exists, false otherwise.
   */
  async existsById(id: number): Promise<boolean> {
    return await this.userRepository.exists({ where: { id } });
  }
}
