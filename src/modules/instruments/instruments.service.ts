import { Injectable, Logger } from '@nestjs/common';
import { ResultCode } from '../../core/common-types';
import {
  InstrumentsRepository,
  InstrumentSearchResult as RepositorySearchResult,
} from './instruments.repository';
import {
  InstrumentSearchRequestDto,
  InstrumentSearchResponseDto,
  InstrumentDto,
  PaginationMetaDto,
} from './dto/instrument-search.dto';
import { InstrumentType } from './instruments.type';

export type SuccessInstrumentSearchResult = {
  type: ResultCode.SUCCESS;
  data: InstrumentSearchResponseDto;
};

export type InvalidParameterResult = {
  type: 'invalidParameter';
  message: string;
};

export type InternalErrorResult = {
  type: ResultCode.FAILED;
  message: string;
};

export type InstrumentSearchResult =
  | SuccessInstrumentSearchResult
  | InvalidParameterResult
  | InternalErrorResult;

// Log messages for tracking the success and failure of the instrument search operation
const INSTRUMENT_SEARCH_SUCCESS_LOG =
  '[cocos-challenge.instruments.search_instruments.success] instrument search success';
const INSTRUMENT_SEARCH_FAILURE_LOG =
  '[cocos-challenge.instruments.search_instruments.failure] instrument search failure';

@Injectable()
export class InstrumentsService {
  private readonly logger = new Logger(InstrumentsService.name);

  constructor(private readonly instrumentsRepository: InstrumentsRepository) {}

  /**
   * Search instruments by ticker and/or name with pagination
   */
  async searchInstruments(
    searchParams: InstrumentSearchRequestDto,
  ): Promise<InstrumentSearchResult> {
    try {
      const { query, type, page = 1, limit = 10 } = searchParams;

      // Validate search parameters
      if (!query && !type) {
        return this.createValidationFailure(
          'At least one search parameter (query or type) is required',
          { query, type },
        );
      }

      // Normalize and validate query
      const normalizedQuery = query?.trim();
      if (query && (!normalizedQuery || normalizedQuery.length < 1)) {
        return this.createValidationFailure(
          'Search query must be at least 1 character long',
          { query: normalizedQuery },
        );
      }

      // Validate pagination parameters
      if (page < 1) {
        return this.createValidationFailure(
          'Page number must be a positive integer',
          { page },
        );
      }

      if (limit < 1 || limit > 100) {
        return this.createValidationFailure('Limit must be between 1 and 100', {
          limit,
        });
      }

      // Perform the search
      const searchResult = await this.instrumentsRepository.searchInstruments({
        query: normalizedQuery,
        type,
        page,
        limit,
      });

      // Handle successful search result
      return this.handleSearchSuccess(
        searchResult,
        normalizedQuery,
        type,
        page,
        limit,
      );
    } catch (error: unknown) {
      return this.handleSearchError(error, searchParams);
    }
  }

  /**
   * Handles successful search result by mapping data and creating response
   */
  private handleSearchSuccess(
    searchResult: RepositorySearchResult,
    query: string | undefined,
    type: InstrumentType | undefined,
    page: number,
    limit: number,
  ): SuccessInstrumentSearchResult {
    // Map instruments to DTOs
    const instrumentDtos = searchResult.instruments.map(
      (instrument) => new InstrumentDto(instrument),
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(searchResult.total / limit);
    const paginationMeta = new PaginationMetaDto(
      page,
      limit,
      searchResult.total,
      totalPages,
      page < totalPages,
      page > 1,
    );

    // Create response
    const response = new InstrumentSearchResponseDto(
      instrumentDtos,
      paginationMeta,
    );

    // Log successful search
    this.logger.log(
      {
        query,
        type,
        page,
        limit,
        total: searchResult.total,
        resultsCount: instrumentDtos.length,
      },
      INSTRUMENT_SEARCH_SUCCESS_LOG,
    );

    return {
      type: ResultCode.SUCCESS,
      data: response,
    };
  }

  /**
   * Handles search errors with proper logging and error categorization
   */
  private handleSearchError(
    error: unknown,
    searchParams: InstrumentSearchRequestDto,
  ): InternalErrorResult {
    this.logger.error({ error, searchParams }, INSTRUMENT_SEARCH_FAILURE_LOG);

    return {
      type: ResultCode.FAILED,
      message: 'Failed to search instruments',
    };
  }

  /**
   * Creates a validation failure result with logging
   */
  private createValidationFailure(
    message: string,
    context: Record<string, unknown>,
  ): InvalidParameterResult {
    this.logger.warn({ message, context }, INSTRUMENT_SEARCH_FAILURE_LOG);

    return {
      type: 'invalidParameter',
      message,
    };
  }
}
