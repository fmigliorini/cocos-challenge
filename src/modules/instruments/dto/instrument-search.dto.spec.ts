import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { InstrumentSearchRequestDto } from './instrument-search.dto';
import { InstrumentSearchResponseDto } from './instrument-search.dto';
import { InstrumentDto } from './instrument-search.dto';
import { PaginationMetaDto } from './instrument-search.dto';
import { InstrumentType } from '../instruments.type';

describe('InstrumentSearchRequestDto', () => {
  /**
   * Validate each field of the dto
   * Notice many of the validations are repeated but it necessary
   * to avoid unexpected changes in the future.
   */
  describe('validation', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        query: 'Apple',
        type: InstrumentType.ACCIONES,
        page: 1,
        limit: 10,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with minimal data', async () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        query: 'AAPL',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass validation with only type', async () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        type: InstrumentType.ACCIONES,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty query', async () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        query: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('query');
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should fail validation with invalid type', async () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        type: 'INVALID_TYPE',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('type');
      expect(errors[0].constraints?.isEnum).toBeDefined();
    });

    it('should fail validation with negative page', async () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        page: -1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
      expect(errors[0].constraints?.min).toBeDefined();
    });

    it('should fail validation with zero page', async () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        page: 0,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('page');
      expect(errors[0].constraints?.min).toBeDefined();
    });

    it('should fail validation with limit too high', async () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        limit: 101,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints?.max).toBeDefined();
    });

    it('should fail validation with limit too low', async () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        limit: 0,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('limit');
      expect(errors[0].constraints?.min).toBeDefined();
    });
  });

  /**
   * Transform the data of the dto
   * This is to ensure that the data is transformed correctly
   */
  describe('transformation', () => {
    it('should trim query string', () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        query: '  Apple  ',
      });

      expect(dto.query).toBe('Apple');
    });

    it('should handle undefined query', () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        query: undefined,
      });

      expect(dto.query).toBeUndefined();
    });

    it('should transform string page to number', () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        page: '5',
      });

      expect(dto.page).toBe(5);
    });

    it('should handle number page', () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        page: 5,
      });

      expect(dto.page).toBe(5);
    });

    it('should transform string limit to number', () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        limit: '20',
      });

      expect(dto.limit).toBe(20);
    });

    it('should handle number limit', () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {
        limit: 20,
      });

      expect(dto.limit).toBe(20);
    });

    it('should apply default values', () => {
      const dto = plainToClass(InstrumentSearchRequestDto, {});

      expect(dto.page).toBe(1);
      expect(dto.limit).toBe(10);
    });
  });
});

describe('InstrumentDto', () => {
  it('should create instance with valid data', () => {
    const instrumentData = {
      id: 1,
      ticker: 'AAPL',
      name: 'Apple Inc.',
      type: InstrumentType.ACCIONES,
    };

    const dto = new InstrumentDto(instrumentData);

    expect(dto.id).toBe(1);
    expect(dto.ticker).toBe('AAPL');
    expect(dto.name).toBe('Apple Inc.');
    expect(dto.type).toBe(InstrumentType.ACCIONES);
  });

  it('should handle different instrument types', () => {
    const stockData = {
      id: 1,
      ticker: 'AAPL',
      name: 'Apple Inc.',
      type: InstrumentType.ACCIONES,
    };

    const currencyData = {
      id: 2,
      ticker: 'BTC',
      name: 'Bitcoin',
      type: InstrumentType.MONEDA,
    };

    const stockDto = new InstrumentDto(stockData);
    const currencyDto = new InstrumentDto(currencyData);

    expect(stockDto.type).toBe(InstrumentType.ACCIONES);
    expect(currencyDto.type).toBe(InstrumentType.MONEDA);
  });
});

/**
 * Test the pagination meta dto
 * This is to ensure that the pagination meta data is calculated correctly
 * Note: Probably this could be moved to a general utility file on a real world.
 */
describe('PaginationMetaDto', () => {
  it('should create instance with valid data', () => {
    const meta = new PaginationMetaDto(2, 10, 25, 3, true, false);

    expect(meta.page).toBe(2);
    expect(meta.limit).toBe(10);
    expect(meta.total).toBe(25);
    expect(meta.totalPages).toBe(3);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrevious).toBe(false);
  });

  it('should calculate pagination correctly for first page', () => {
    const meta = new PaginationMetaDto(1, 10, 25, 3, true, false);

    expect(meta.page).toBe(1);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrevious).toBe(false);
  });

  it('should calculate pagination correctly for last page', () => {
    const meta = new PaginationMetaDto(3, 10, 25, 3, false, true);

    expect(meta.page).toBe(3);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrevious).toBe(true);
  });

  it('should calculate pagination correctly for middle page', () => {
    const meta = new PaginationMetaDto(2, 10, 25, 3, true, true);

    expect(meta.page).toBe(2);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrevious).toBe(true);
  });

  it('should handle empty results', () => {
    const meta = new PaginationMetaDto(1, 10, 0, 0, false, false);

    expect(meta.total).toBe(0);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrevious).toBe(false);
  });
});

/**
 * Test the instrument search response dto
 * This is to ensure that the response data is calculated correctly
 */
describe('InstrumentSearchResponseDto', () => {
  it('should create instance with valid data', () => {
    const instruments = [
      new InstrumentDto({
        id: 1,
        ticker: 'AAPL',
        name: 'Apple Inc.',
        type: InstrumentType.ACCIONES,
      }),
      new InstrumentDto({
        id: 2,
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        type: InstrumentType.ACCIONES,
      }),
    ];

    const pagination = new PaginationMetaDto(1, 10, 2, 1, false, false);
    const response = new InstrumentSearchResponseDto(instruments, pagination);

    expect(response.instruments).toHaveLength(2);
    expect(response.instruments[0].ticker).toBe('AAPL');
    expect(response.instruments[1].ticker).toBe('GOOGL');
    expect(response.pagination).toBe(pagination);
  });

  it('should handle empty results', () => {
    const instruments: InstrumentDto[] = [];
    const pagination = new PaginationMetaDto(1, 10, 0, 0, false, false);
    const response = new InstrumentSearchResponseDto(instruments, pagination);

    expect(response.instruments).toHaveLength(0);
    expect(response.pagination.total).toBe(0);
  });

  it('should handle single result', () => {
    const instruments = [
      new InstrumentDto({
        id: 1,
        ticker: 'AAPL',
        name: 'Apple Inc.',
        type: InstrumentType.ACCIONES,
      }),
    ];

    const pagination = new PaginationMetaDto(1, 10, 1, 1, false, false);
    const response = new InstrumentSearchResponseDto(instruments, pagination);

    expect(response.instruments).toHaveLength(1);
    expect(response.instruments[0].ticker).toBe('AAPL');
  });
});
