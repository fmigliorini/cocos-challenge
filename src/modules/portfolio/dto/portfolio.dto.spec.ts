import { validate } from 'class-validator';
import {
  PortfolioRequestDto,
  PortfolioResponseDto,
  PositionDto,
} from './portfolio.dto';
import { PortfolioDetails, PositiionDetails } from '../portfolio.types';

describe('Portfolio DTOs', () => {
  describe('PortfolioRequestDto', () => {
    it('should be defined', () => {
      expect(PortfolioRequestDto).toBeDefined();
    });

    it('should create a valid instance with correct data', () => {
      const dto = new PortfolioRequestDto();
      dto.userId = 1;

      expect(dto.userId).toBe(1);
    });

    // Recommended test: cover the case where the userId is a valid number
    it('should pass validation with valid data', async () => {
      const dto = new PortfolioRequestDto();
      dto.userId = 1;

      // Run the validation
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    // Edge case: cover the case where the userId is not a number
    it('should fail validation with invalid userId (not a number)', async () => {
      const dto = new PortfolioRequestDto();
      // Small hack to bypass the type check :)
      (dto as unknown as { userId: string }).userId = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
    });

    // Edge case: cover the case where the userId is a negative number
    it('should fail validation with invalid userId (negative number)', async () => {
      const dto = new PortfolioRequestDto();
      dto.userId = -1;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
    });

    // Edge case: cover the case where the userId is zero
    it('should fail validation with invalid userId (zero)', async () => {
      const dto = new PortfolioRequestDto();
      dto.userId = 0;

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
    });

    // Edge case: cover the case where the userId is missing
    it('should fail validation with missing userId', async () => {
      const dto = new PortfolioRequestDto();

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
    });
  });

  describe('PortfolioResponseDto', () => {
    const mockPortfolioDetails: PortfolioDetails = {
      totalAccountValue: '10000.00',
      availableCashAfterReserves: '5000.00',
      positions: [
        {
          ticker: 'AAPL',
          name: 'Apple Inc.',
          qty: 10,
          positionValue: '1500.00',
          totalReturnPct: '7.14',
        },
      ],
    };

    // Recommended test: cover the case where the DTO is defined
    it('should be defined', () => {
      expect(PortfolioResponseDto).toBeDefined();
    });

    it('should create a valid instance with constructor', () => {
      const dto = new PortfolioResponseDto(mockPortfolioDetails, 1);

      expect(dto.userId).toBe(1);
      expect(dto.totalAccountValue).toBe('10000.00');
      expect(dto.availableCash).toBe('5000.00');
      expect(dto.positions).toHaveLength(1);
      expect(dto.positions[0]).toBeInstanceOf(PositionDto);
    });

    it('should pass validation with valid data', async () => {
      const dto = new PortfolioResponseDto(mockPortfolioDetails, 1);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    // Edge case: this should never happen at this point in the code
    it('should fail validation with invalid userId', async () => {
      const dto = new PortfolioResponseDto(mockPortfolioDetails, -1);

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
    });

    // From here felds validation starts

    it('should fail validation with empty totalAccountValue', async () => {
      const dto = new PortfolioResponseDto(mockPortfolioDetails, 1);
      dto.totalAccountValue = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('totalAccountValue');
    });

    it('should fail validation with empty availableCash', async () => {
      const dto = new PortfolioResponseDto(mockPortfolioDetails, 1);
      dto.availableCash = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('availableCash');
    });

    it('should fail validation with non-array positions', async () => {
      const dto = new PortfolioResponseDto(mockPortfolioDetails, 1);
      (dto as unknown as { positions: string }).positions = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('positions');
    });

    it('should handle empty positions array', () => {
      const emptyPortfolioDetails: PortfolioDetails = {
        totalAccountValue: '1000.00',
        availableCashAfterReserves: '1000.00',
        positions: [],
      };

      const dto = new PortfolioResponseDto(emptyPortfolioDetails, 1);

      expect(dto.positions).toHaveLength(0);
    });

    it('should handle multiple positions', () => {
      const multiPositionDetails: PortfolioDetails = {
        totalAccountValue: '15000.00',
        availableCashAfterReserves: '5000.00',
        positions: [
          {
            ticker: 'AAPL',
            name: 'Apple Inc.',
            qty: 10,
            positionValue: '1500.00',
            totalReturnPct: '7.14',
          },
          {
            ticker: 'GOOGL',
            name: 'Alphabet Inc.',
            qty: 5,
            positionValue: '8000.00',
            totalReturnPct: '6.67',
          },
        ],
      };

      const dto = new PortfolioResponseDto(multiPositionDetails, 1);

      expect(dto.positions).toHaveLength(2);
      expect(dto.positions[0].ticker).toBe('AAPL');
      expect(dto.positions[1].ticker).toBe('GOOGL');
    });
  });

  describe('PositionDto', () => {
    const mockPositionDetails: PositiionDetails = {
      ticker: 'AAPL',
      name: 'Apple Inc.',
      qty: 10,
      positionValue: '1500.00',
      totalReturnPct: '7.14',
    };

    // Recommended test: cover the case where the DTO is defined
    it('should be defined', () => {
      expect(PositionDto).toBeDefined();
    });

    it('should create a valid instance with constructor', () => {
      const dto = new PositionDto(mockPositionDetails);

      expect(dto.ticker).toBe('AAPL');
      expect(dto.name).toBe('Apple Inc.');
      expect(dto.quantity).toBe(10);
      expect(dto.marketValue).toBe('1500.00');
      expect(dto.averageCost).toBe('0.00'); // Not available in PositiionDetails type
      expect(dto.pnlPercentage).toBe('7.14');
    });

    // From here fields validation starts

    it('should pass validation with valid data', async () => {
      const dto = new PositionDto(mockPositionDetails);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation with empty ticker', async () => {
      const dto = new PositionDto(mockPositionDetails);
      dto.ticker = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ticker');
    });

    it('should fail validation with empty name', async () => {
      const dto = new PositionDto(mockPositionDetails);
      dto.name = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation with invalid quantity', async () => {
      const dto = new PositionDto(mockPositionDetails);
      (dto as unknown as { quantity: string }).quantity = 'invalid';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('quantity');
    });

    it('should fail validation with empty marketValue', async () => {
      const dto = new PositionDto(mockPositionDetails);
      dto.marketValue = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('marketValue');
    });

    it('should fail validation with empty averageCost', async () => {
      const dto = new PositionDto(mockPositionDetails);
      dto.averageCost = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('averageCost');
    });

    it('should fail validation with empty pnlPercentage', async () => {
      const dto = new PositionDto(mockPositionDetails);
      dto.pnlPercentage = '';

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('pnlPercentage');
    });

    it('should handle null/undefined values with defaults', () => {
      const positionWithNulls: PositiionDetails = {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        qty: 10,
        positionValue: undefined,
        totalReturnPct: undefined,
      };

      const dto = new PositionDto(positionWithNulls);

      expect(dto.marketValue).toBe('0.00');
      expect(dto.averageCost).toBe('0.00'); // Always '0.00' since not in PositiionDetails
      expect(dto.pnlPercentage).toBe('0.00');
    });

    it('should handle negative quantity (short position)', () => {
      const shortPosition: PositiionDetails = {
        ticker: 'TSLA',
        name: 'Tesla Inc.',
        qty: -5,
        positionValue: '-1000.00',
        totalReturnPct: '0.00',
      };

      const dto = new PositionDto(shortPosition);

      expect(dto.quantity).toBe(-5);
      expect(dto.marketValue).toBe('-1000.00');
    });

    it('should handle zero quantity', () => {
      const zeroPosition: PositiionDetails = {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        qty: 0,
        positionValue: '0.00',
        totalReturnPct: '0.00',
      };

      const dto = new PositionDto(zeroPosition);

      expect(dto.quantity).toBe(0);
      expect(dto.marketValue).toBe('0.00');
    });
  });

  // Recommended test: cover the case where the DTO is integrated (cascade checks)
  describe('DTO Integration Tests', () => {
    it('should create complete portfolio response with multiple positions', () => {
      const portfolioDetails: PortfolioDetails = {
        totalAccountValue: '20000.00',
        availableCashAfterReserves: '5000.00',
        positions: [
          {
            ticker: 'AAPL',
            name: 'Apple Inc.',
            qty: 10,
            positionValue: '1500.00',
            totalReturnPct: '7.14',
          },
          {
            ticker: 'GOOGL',
            name: 'Alphabet Inc.',
            qty: 5,
            positionValue: '8000.00',
            totalReturnPct: '6.67',
          },
          {
            ticker: 'TSLA',
            name: 'Tesla Inc.',
            qty: -2,
            positionValue: '-1000.00',
            totalReturnPct: '0.00',
          },
        ],
      };

      const responseDto = new PortfolioResponseDto(portfolioDetails, 123);

      expect(responseDto.userId).toBe(123);
      expect(responseDto.totalAccountValue).toBe('20000.00');
      expect(responseDto.availableCash).toBe('5000.00');
      expect(responseDto.positions).toHaveLength(3);

      // Check first position
      expect(responseDto.positions[0].ticker).toBe('AAPL');
      expect(responseDto.positions[0].quantity).toBe(10);
      expect(responseDto.positions[0].marketValue).toBe('1500.00');

      // Check second position
      expect(responseDto.positions[1].ticker).toBe('GOOGL');
      expect(responseDto.positions[1].quantity).toBe(5);
      expect(responseDto.positions[1].marketValue).toBe('8000.00');

      // Check short position
      expect(responseDto.positions[2].ticker).toBe('TSLA');
      expect(responseDto.positions[2].quantity).toBe(-2);
      expect(responseDto.positions[2].marketValue).toBe('-1000.00');
    });

    it('should validate complete portfolio response', async () => {
      const portfolioDetails: PortfolioDetails = {
        totalAccountValue: '10000.00',
        availableCashAfterReserves: '5000.00',
        positions: [
          {
            ticker: 'AAPL',
            name: 'Apple Inc.',
            qty: 10,
            positionValue: '1500.00',
            totalReturnPct: '7.14',
          },
        ],
      };

      const responseDto = new PortfolioResponseDto(portfolioDetails, 1);

      const errors = await validate(responseDto);
      expect(errors).toHaveLength(0);
    });
  });
});
