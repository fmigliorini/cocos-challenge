import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { InstrumentsController } from './instruments.controller';
import { InstrumentsService } from './instruments.service';
import { InstrumentType } from './instruments.type';
import { ResultCode } from '../../core/common-types';

describe('InstrumentsController', () => {
  let controller: InstrumentsController;
  let service: InstrumentsService;
  let searchInstrumentsSpy: jest.SpyInstance;

  const mockInstrument = {
    id: 1,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    type: InstrumentType.ACCIONES,
  };

  const mockSearchResponse = {
    instruments: [mockInstrument],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InstrumentsController],
      providers: [
        {
          provide: InstrumentsService,
          useValue: {
            searchInstruments: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<InstrumentsController>(InstrumentsController);
    service = module.get<InstrumentsService>(InstrumentsService);
    searchInstrumentsSpy = jest.spyOn(service, 'searchInstruments');
  });

  // Controller initialization test
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('searchInstruments', () => {
    describe('successful requests', () => {
      it('should search instruments by query successfully', async () => {
        const mockResult = {
          type: ResultCode.SUCCESS,
          data: mockSearchResponse,
        };

        searchInstrumentsSpy.mockResolvedValue(mockResult);

        const result = await controller.searchInstruments({
          query: 'AAPL',
          page: 1,
          limit: 10,
        });

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          query: 'AAPL',
          page: 1,
          limit: 10,
        });

        expect(result).toEqual(mockSearchResponse);
        expect(result.instruments).toHaveLength(1);
        expect(result.instruments[0]).toMatchObject(mockInstrument);
      });

      it('should search instruments by type successfully', async () => {
        const mockResult = {
          type: ResultCode.SUCCESS,
          data: mockSearchResponse,
        };

        searchInstrumentsSpy.mockResolvedValue(mockResult);

        const result = await controller.searchInstruments({
          type: InstrumentType.ACCIONES,
        });

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          type: InstrumentType.ACCIONES,
        });

        expect(result).toEqual(mockSearchResponse);
      });

      it('should search instruments by both query and type successfully', async () => {
        const mockResult = {
          type: ResultCode.SUCCESS,
          data: mockSearchResponse,
        };

        searchInstrumentsSpy.mockResolvedValue(mockResult);

        const result = await controller.searchInstruments({
          query: 'Apple',
          type: InstrumentType.ACCIONES,
          page: 2,
          limit: 20,
        });

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          query: 'Apple',
          type: InstrumentType.ACCIONES,
          page: 2,
          limit: 20,
        });

        expect(result).toEqual(mockSearchResponse);
      });

      it('should handle empty search parameters', async () => {
        const mockResult = {
          type: ResultCode.SUCCESS,
          data: mockSearchResponse,
        };

        searchInstrumentsSpy.mockResolvedValue(mockResult);

        const result = await controller.searchInstruments({});

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({});
        expect(result).toEqual(mockSearchResponse);
      });
    });

    // Error handling from the service layer
    describe('error handling', () => {
      // Invalid parameter errors from the service layer
      it('should throw BadRequestException for invalid parameter errors', async () => {
        const mockResult = {
          type: 'invalidParameter',
          message: 'At least one search parameter (query or type) is required',
        };

        searchInstrumentsSpy.mockResolvedValue(mockResult);

        await expect(controller.searchInstruments({})).rejects.toThrow(
          new HttpException(
            'At least one search parameter (query or type) is required',
            HttpStatus.BAD_REQUEST,
          ),
        );

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({});
      });

      // Internal errors from the service layer
      it('should throw ConflictException for internal errors', async () => {
        const mockResult = {
          type: ResultCode.FAILED,
          message: 'Failed to search instruments',
        };

        searchInstrumentsSpy.mockResolvedValue(mockResult);

        await expect(
          controller.searchInstruments({ query: 'AAPL' }),
        ).rejects.toThrow(
          new HttpException(
            'Failed to search instruments',
            HttpStatus.CONFLICT,
          ),
        );

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          query: 'AAPL',
        });
      });

      // Validation errors from the service layer
      it('should handle validation errors with different messages', async () => {
        const validationErrors = [
          {
            type: 'invalidParameter',
            message: 'Search query must be at least 1 character long',
          },
          {
            type: 'invalidParameter',
            message: 'Page number must be a positive integer',
          },
          {
            type: 'invalidParameter',
            message: 'Limit must be between 1 and 100',
          },
        ];

        for (const error of validationErrors) {
          searchInstrumentsSpy.mockResolvedValue(error);

          await expect(
            controller.searchInstruments({ query: 'AAPL' }),
          ).rejects.toThrow(HttpException);

          expect(searchInstrumentsSpy).toHaveBeenCalledWith({
            query: 'AAPL',
          });
        }
      });
    });

    // Query parameter transformation
    describe('query parameter transformation', () => {
      it('should handle string parameters correctly', async () => {
        const mockResult = {
          type: ResultCode.SUCCESS,
          data: mockSearchResponse,
        };

        searchInstrumentsSpy.mockResolvedValue(mockResult);

        // Test with proper types
        const result = await controller.searchInstruments({
          query: 'AAPL',
          page: 1,
          limit: 10,
        });

        expect(searchInstrumentsSpy).toHaveBeenCalledWith({
          query: 'AAPL',
          page: 1,
          limit: 10,
        });

        expect(result).toEqual(mockSearchResponse);
      });
    });
  });
});
