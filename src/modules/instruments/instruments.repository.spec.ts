/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InstrumentsRepository } from './instruments.repository';
import { Instrument } from './entities/instrument.entity';
import { InstrumentType } from './instruments.type';

describe('InstrumentsRepository', () => {
  let repository: InstrumentsRepository;
  let mockRepository: jest.Mocked<Repository<Instrument>>;
  let createQueryBuilderSpy: jest.SpyInstance;

  const mockInstrument = {
    id: 1,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    type: InstrumentType.ACCIONES,
    orders: [],
    marketData: [],
  } as Instrument;

  const mockInstruments = [
    mockInstrument,
    {
      id: 2,
      ticker: 'GOOGL',
      name: 'Alphabet Inc.',
      type: InstrumentType.ACCIONES,
      orders: [],
      marketData: [],
    } as Instrument,
    {
      id: 3,
      ticker: 'BTC',
      name: 'Bitcoin',
      type: InstrumentType.MONEDA,
      orders: [],
      marketData: [],
    } as Instrument,
  ];

  beforeEach(async () => {
    const mockSelectQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentsRepository,
        {
          provide: getRepositoryToken(Instrument),
          useValue: mockSelectQueryBuilder,
        },
      ],
    }).compile();

    repository = module.get<InstrumentsRepository>(InstrumentsRepository);
    mockRepository = module.get(getRepositoryToken(Instrument));

    // Create spy for createQueryBuilder method
    createQueryBuilderSpy = jest.spyOn(mockRepository, 'createQueryBuilder');
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('searchInstruments', () => {
    let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Instrument>>;

    beforeEach(() => {
      mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn(),
        getMany: jest.fn(),
        getRawMany: jest.fn(),
        getRawOne: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        findByIds: jest.fn(),
        count: jest.fn(),
        createQueryBuilder: jest.fn(),
      } as unknown as jest.Mocked<SelectQueryBuilder<Instrument>>;

      createQueryBuilderSpy.mockReturnValue(mockQueryBuilder);
    });

    it('should search instruments by query successfully', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockInstrument]);

      const result = await repository.searchInstruments({
        query: 'AAPL',
        page: 1,
        limit: 10,
      });

      expect(createQueryBuilderSpy).toHaveBeenCalledWith('instrument');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(instrument.ticker) LIKE :searchTerm OR LOWER(instrument.name) LIKE :searchTerm)',
        { searchTerm: '%aapl%' },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'instrument.ticker',
        'ASC',
      );

      expect(result).toEqual({
        instruments: [mockInstrument],
        total: 1,
      });
    });

    it('should search instruments by type successfully', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(2);
      mockQueryBuilder.getMany.mockResolvedValue([
        mockInstrument,
        {
          id: 2,
          ticker: 'GOOGL',
          name: 'Alphabet Inc.',
          type: InstrumentType.ACCIONES,
          orders: [],
          marketData: [],
        } as Instrument,
      ]);

      const result = await repository.searchInstruments({
        type: InstrumentType.ACCIONES,
        page: 1,
        limit: 10,
      });

      expect(createQueryBuilderSpy).toHaveBeenCalledWith('instrument');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'instrument.type = :type',
        { type: InstrumentType.ACCIONES },
      );
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'instrument.ticker',
        'ASC',
      );

      expect(result).toEqual({
        instruments: [
          mockInstrument,
          {
            id: 2,
            ticker: 'GOOGL',
            name: 'Alphabet Inc.',
            type: InstrumentType.ACCIONES,
            orders: [],
            marketData: [],
          } as Instrument,
        ],
        total: 2,
      });
    });

    it('should search instruments by both query and type', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockInstrument]);

      const result = await repository.searchInstruments({
        query: 'Apple',
        type: InstrumentType.ACCIONES,
        page: 1,
        limit: 10,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(instrument.ticker) LIKE :searchTerm OR LOWER(instrument.name) LIKE :searchTerm)',
        { searchTerm: '%apple%' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'instrument.type = :type',
        { type: InstrumentType.ACCIONES },
      );

      expect(result).toEqual({
        instruments: [mockInstrument],
        total: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(25);
      mockQueryBuilder.getMany.mockResolvedValue(mockInstruments);

      const result = await repository.searchInstruments({
        query: 'test',
        page: 3,
        limit: 10,
      });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20); // (3-1) * 10
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);

      expect(result).toEqual({
        instruments: mockInstruments,
        total: 25,
      });
    });

    it('should handle empty results', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await repository.searchInstruments({
        query: 'nonexistent',
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        instruments: [],
        total: 0,
      });
    });

    it('should handle case-insensitive search', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue([mockInstrument]);

      await repository.searchInstruments({
        query: 'apple',
        page: 1,
        limit: 10,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(instrument.ticker) LIKE :searchTerm OR LOWER(instrument.name) LIKE :searchTerm)',
        { searchTerm: '%apple%' },
      );
    });
  });
});
