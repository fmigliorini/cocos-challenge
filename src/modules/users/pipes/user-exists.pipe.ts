import { Injectable, NotFoundException, PipeTransform } from "@nestjs/common";
import { UsersRepository } from "../users.repository";

/**
 * Pipe to check if a user exists by their ID.
 */
@Injectable()
export class UserExistsPipe implements PipeTransform<number, Promise<number>> {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * @param userId - The ID of the user to check if it exists.
   * @returns The ID of the user if it exists.
   * @throws NotFoundException if the user does not exist.
   */
  async transform(userId: number): Promise<number> {
    const user = await this.usersRepository.existsById(userId);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
    return userId;
  }
}