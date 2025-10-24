import {
  Injectable,
  PipeTransform,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { UsersRepository } from '../../users/users.repository';

@Injectable()
export class ValidateUserHeaderPipe implements PipeTransform {
  constructor(
    @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
  ) {}

  async transform(value: string): Promise<number> {
    if (!value) {
      throw new BadRequestException('userId is required');
    }

    const userId = parseInt(value, 10);

    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid userId');
    }

    const userExists = await this.usersRepository.existsById(userId);
    if (!userExists) {
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }

    return userId;
  }
}
