import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { InstrumentsService } from './instruments.service';
import { ResultCode } from 'src/core/common-types';
import {
  InstrumentSearchRequestDto,
  InstrumentSearchResponseDto,
} from './dto/instrument-search.dto';
import { InstrumentType } from './instruments.type';

@ApiTags('Instruments')
@Controller('instruments')
export class InstrumentsController {
  constructor(private readonly instrumentsService: InstrumentsService) {}

  @Get('search')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Search instruments',
    description:
      'Search for instruments by ticker and/or name with pagination support',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'Search query for ticker or name',
    example: 'AAPL',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filter by instrument type',
    enum: InstrumentType,
    example: InstrumentType.ACCIONES,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiOkResponse({
    description: 'Instruments found successfully',
    type: InstrumentSearchResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid search parameters or validation errors',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'At least one search parameter (query or type) is required',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error or database connection issues',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'Failed to search instruments' },
      },
    },
  })
  async searchInstruments(
    // Note: ValidationPipe is used to transform the query params to the DTO
    @Query(new ValidationPipe({ transform: true }))
    searchParams: InstrumentSearchRequestDto,
  ): Promise<InstrumentSearchResponseDto> {
    const result =
      await this.instrumentsService.searchInstruments(searchParams);

    switch (result.type) {
      case ResultCode.SUCCESS:
        return result.data;
      case 'invalidParameter':
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      case ResultCode.FAILED:
        throw new HttpException(result.message, HttpStatus.CONFLICT);
    }
  }
}
