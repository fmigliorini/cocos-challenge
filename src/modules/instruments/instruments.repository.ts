import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Instrument } from './entities/instrument.entity';
import { InstrumentType } from './instruments.type';

export interface InstrumentSearchParams {
  query?: string;
  type?: InstrumentType;
  page: number;
  limit: number;
}

export interface InstrumentSearchResult {
  instruments: Instrument[];
  total: number;
}

@Injectable()
export class InstrumentsRepository {
  private readonly logger = new Logger(InstrumentsRepository.name);

  constructor(
    @InjectRepository(Instrument)
    private readonly instrumentsRepository: Repository<Instrument>,
  ) {}

  /**
   * Search instruments by ticker and/or name with pagination
   * Supports partial matching and case-insensitive search
   */
  async searchInstruments(
    params: InstrumentSearchParams,
  ): Promise<InstrumentSearchResult> {
    try {
      const { query, type, page, limit } = params;
      const offset = (page - 1) * limit;

      // Build the base query
      const queryBuilder = this.buildSearchQuery(query, type);

      // Get total count for pagination
      const total = await queryBuilder.getCount();

      // Apply pagination and get results
      const instruments = await queryBuilder.skip(offset).take(limit).getMany();

      this.logger.log(
        {
          query,
          type,
          page,
          limit,
          total,
          resultsCount: instruments.length,
        },
        'Instrument search completed',
      );

      return {
        instruments,
        total,
      };
    } catch (error: unknown) {
      this.logger.error({ error, params }, 'Failed to search instruments');
      throw error;
    }
  }

  /**
   * Build the search query with filters
   */
  private buildSearchQuery(
    query?: string,
    type?: InstrumentType,
  ): SelectQueryBuilder<Instrument> {
    const queryBuilder =
      this.instrumentsRepository.createQueryBuilder('instrument');

    // Apply search query filter (ticker or name)
    if (query && query.trim()) {
      const searchTerm = `%${query.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(instrument.ticker) LIKE :searchTerm OR LOWER(instrument.name) LIKE :searchTerm)',
        { searchTerm },
      );
    }

    // Apply type filter
    if (type) {
      queryBuilder.andWhere('instrument.type = :type', { type });
    }

    // Order by ticker for consistent results
    queryBuilder.orderBy('instrument.ticker', 'ASC');

    return queryBuilder;
  }
}
