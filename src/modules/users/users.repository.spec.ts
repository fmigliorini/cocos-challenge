import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersRepository } from './users.repository';
import { Users } from './entities/user.entity';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let userRepository: jest.Mocked<Repository<Users>>;
  let existsSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockUserRepository = {
      exists: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getRepositoryToken(Users),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    userRepository = module.get(getRepositoryToken(Users));

    // Create spy for the exists method
    existsSpy = jest.spyOn(userRepository, 'exists');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('existsById', () => {
    const userId = 1;

    it('should return true when user exists', async () => {
      // Arrange
      existsSpy.mockResolvedValue(true);

      // Act
      const result = await repository.existsById(userId);

      // Assert
      expect(result).toBe(true);
      expect(existsSpy).toHaveBeenCalledWith({ where: { id: userId } });
      expect(existsSpy).toHaveBeenCalledTimes(1);
    });

    it('should return false when user does not exist', async () => {
      // Arrange
      existsSpy.mockResolvedValue(false);

      // Act
      const result = await repository.existsById(userId);

      // Assert
      expect(result).toBe(false);
      expect(existsSpy).toHaveBeenCalledWith({ where: { id: userId } });
      expect(existsSpy).toHaveBeenCalledTimes(1);
    });
  });

  // Recommended initializtion test
  describe('repository initialization', () => {
    it('should be defined', () => {
      expect(repository).toBeDefined();
    });

    it('should have Users repository injected', () => {
      expect(userRepository).toBeDefined();
    });
  });
});
