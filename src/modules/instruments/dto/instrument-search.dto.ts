import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { InstrumentType } from '../instruments.type';

/**
 * Instrument Search Request DTO
 * This class represents the request for searching instruments.
 * It supports searching by ticker and/or name with pagination.
 */
export class InstrumentSearchRequestDto {
  @ApiProperty({
    required: false,
    description: 'Search query for ticker or name',
    example: 'AAPL',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: string | undefined }) => value?.trim())
  query?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by instrument type',
    enum: InstrumentType,
    example: InstrumentType.ACCIONES,
  })
  @IsOptional()
  @IsEnum(InstrumentType)
  type?: InstrumentType;

  @ApiProperty({
    required: false,
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: string | number | undefined }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }: { value: string | number | undefined }) =>
    typeof value === 'string' ? parseInt(value, 10) : value,
  )
  limit?: number = 10;
}

/**
 * Instrument DTO
 * This class represents an instrument in the search results.
 */
export class InstrumentDto {
  @ApiProperty({
    required: true,
    description: 'The instrument ID',
    example: 1,
  })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({
    required: true,
    description: 'The instrument ticker',
    example: 'AAPL',
  })
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @ApiProperty({
    required: true,
    description: 'The instrument name',
    example: 'Apple Inc.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: true,
    description: 'The instrument type',
    enum: InstrumentType,
    example: InstrumentType.ACCIONES,
  })
  @IsEnum(InstrumentType)
  type: InstrumentType;

  constructor(instrument: {
    id: number;
    ticker: string;
    name: string;
    type: InstrumentType;
  }) {
    this.id = instrument.id;
    this.ticker = instrument.ticker;
    this.name = instrument.name;
    this.type = instrument.type;
  }
}

/**
 * Pagination Meta DTO
 * This class represents pagination metadata for search results.
 * Note: Probably this could be moved to a general utility file on a real world.
 */
export class PaginationMetaDto {
  @ApiProperty({
    required: true,
    description: 'Current page number',
    example: 1,
  })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    required: true,
    description: 'Number of items per page',
    example: 10,
  })
  @IsInt()
  @Min(1)
  limit: number;

  @ApiProperty({
    required: true,
    description: 'Total number of items',
    example: 100,
  })
  @IsInt()
  @Min(0)
  total: number;

  @ApiProperty({
    required: true,
    description: 'Total number of pages',
    example: 10,
  })
  @IsInt()
  @Min(0)
  totalPages: number;

  @ApiProperty({
    required: true,
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    required: true,
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrevious: boolean;

  constructor(
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrevious: boolean,
  ) {
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = totalPages;
    this.hasNext = hasNext;
    this.hasPrevious = hasPrevious;
  }
}

/**
 * Instrument Search Response DTO
 * This class represents the response for instrument search.
 * It contains pagination metadata and the list of instruments.
 */
export class InstrumentSearchResponseDto {
  @ApiProperty({
    required: true,
    description: 'List of instruments matching the search criteria',
    type: [InstrumentDto],
  })
  instruments: InstrumentDto[];

  @ApiProperty({
    required: true,
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  pagination: PaginationMetaDto;

  constructor(instruments: InstrumentDto[], pagination: PaginationMetaDto) {
    this.instruments = instruments;
    this.pagination = pagination;
  }
}
