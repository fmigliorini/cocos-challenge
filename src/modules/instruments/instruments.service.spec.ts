import { Test, TestingModule } from '@nestjs/testing';
import { InstrumentsService } from './instruments.service';
import { InstrumentsRepository } from './instruments.repository';
import { InstrumentType } from './instruments.type';
import { ResultCode } from '../../core/common-types';
import { Instrument } from './entities/instrument.entity';

describe('InstrumentsService', () => {
  let service: InstrumentsService;
  let repository: InstrumentsRepository;
  let searchInstrumentsSpy: jest.SpyInstance;

  const mockInstrument: Instrument = {
    id: 1,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    type: InstrumentType.ACCIONES,
    orders: [],
    marketData: [],
  } as Instrument;

  const mockSearchResult = {
    instruments: [mockInstrument],
    total: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstrumentsService,
        {
          provide: InstrumentsRepository,
          useValue: {
            searchInstruments: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InstrumentsService>(InstrumentsService);
    repository = module.get<InstrumentsRepository>(InstrumentsRepository);
    searchInstrumentsSpy = jest.spyOn(repository, 'searchInstruments');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchInstruments', () => {
    // Validation errors in case DTO doesn't prevent it.
    describe('validation', () => {
      it('should return validation error when no query or type provided', async () => {
        const result = await service.searchInstruments({});

        expect(result.type).toBe('invalidParameter');
        if (result.type === 'invalidParameter') {
          expect(result.message).toBe(
            'At least one search parameter (query or type) is required',
          );
        }
      });

      it('should return validation error when query is empty string', async () => {
        const result = await service.searchInstruments({ query: '   ' });

        expect(result.type).toBe('invalidParameter');
        if (result.type === 'invalidParameter') {
          expect(result.message).toBe(
            'Search query must be at least 1 character long',
          );
        }
      });

      it('should return validation error when page is less than 1', async () => {
        const result = await service.searchInstruments({
          query: 'AAPL',
          page: 0,
        });

        expect(result.type).toBe('invalidParameter');
        if (result.type === 'invalidParameter') {
          expect(result.message).toBe('Page number must be a positive integer');
        }
      });

      it('should return validation error when limit is less than 1', async () => {
        const result = await service.searchInstruments({
          query: 'AAPL',
          limit: 0,
        });

        expect(result.type).toBe('invalidParameter');
        if (result.type === 'invalidParameter') {
          expect(result.message).toBe('Limit must be between 1 and 100');
        }
      });

      it('should return validation error when limit is greater than 100', async () => {
        const result = await service.searchInstruments({
          query: 'AAPL',
          limit: 101,
        });

        expect(result.type).toBe('invalidParameter');
        if (result.type === 'invalidParameter') {
          expect(result.message).toBe('Limit must be between 1 and 100');
        }
      });
    });

    // Handle all search scenarios.
    describe('Search', () => {
      beforeEach(() => {
        searchInstrumentsSpy.mockResolvedValue(mockSearchResult);
      });

      // Search instruments by query successfully.
      it('should search instruments by query successfully', async () => {
        const searchParams = {
          query: 'AAPL',
          page: 1,
          limit: 10,
        };

        const result = await service.searchInstruments(searchParams);

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          query: 'AAPL',
          type: undefined,
          page: 1,
          limit: 10,
        });

        expect(result.type).toBe(ResultCode.SUCCESS);
        if (result.type === ResultCode.SUCCESS) {
          expect(result.data.instruments).toHaveLength(1);
          expect(result.data.instruments[0]).toMatchObject({
            id: 1,
            ticker: 'AAPL',
            name: 'Apple Inc.',
            type: InstrumentType.ACCIONES,
          });
          expect(result.data.pagination).toMatchObject({
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          });
        }
      });

      // Search instruments by type successfully.
      it('should search instruments by type successfully', async () => {
        const searchParams = {
          type: InstrumentType.ACCIONES,
          page: 1,
          limit: 10,
        };

        const result = await service.searchInstruments(searchParams);

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          query: undefined,
          type: InstrumentType.ACCIONES,
          page: 1,
          limit: 10,
        });

        expect(result.type).toBe(ResultCode.SUCCESS);
        if (result.type === ResultCode.SUCCESS) {
          expect(result.data.instruments).toHaveLength(1);
        }
      });

      // Search instruments by both query and type successfully.
      it('should search instruments by both query and type successfully', async () => {
        const searchParams = {
          query: 'Apple',
          type: InstrumentType.ACCIONES,
          page: 1,
          limit: 10,
        };

        const result = await service.searchInstruments(searchParams);

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          query: 'Apple',
          type: InstrumentType.ACCIONES,
          page: 1,
          limit: 10,
        });

        expect(result.type).toBe(ResultCode.SUCCESS);
      });

      // Handle pagination correctly (response should have the correct pagination data).
      it('should handle pagination correctly', async () => {
        const largeSearchResult = {
          instruments: Array.from({ length: 25 }, (_, i) => ({
            ...mockInstrument,
            id: i + 1,
            ticker: `TICKER${i + 1}`,
          })),
          total: 25,
        };

        searchInstrumentsSpy.mockResolvedValue(largeSearchResult);

        const result = await service.searchInstruments({
          query: 'test',
          page: 2,
          limit: 10,
        });

        if (result.type === ResultCode.SUCCESS) {
          expect(result.data.pagination).toMatchObject({
            page: 2,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: true,
            hasPrevious: true,
          });
        }
      });

      // Trim query whitespace, make sure we prevent unnecessary whitespace in the query.
      it('should trim query whitespace', async () => {
        const result = await service.searchInstruments({
          query: '  AAPL  ',
        });

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          query: 'AAPL',
          type: undefined,
          page: 1,
          limit: 10,
        });

        expect(result.type).toBe(ResultCode.SUCCESS);
      });

      it('should use default pagination values', async () => {
        const result = await service.searchInstruments({
          query: 'AAPL',
        });

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          query: 'AAPL',
          type: undefined,
          page: 1,
          limit: 10,
        });

        expect(result.type).toBe(ResultCode.SUCCESS);
      });
    });
  });
});
