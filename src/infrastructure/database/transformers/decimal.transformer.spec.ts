import { DecimalAsStringTransformer } from './decimal.transformer';

describe('DecimalAsStringTransformer', () => {
  let transformer: DecimalAsStringTransformer;

  beforeEach(() => {
    transformer = new DecimalAsStringTransformer();
  });

  describe('to', () => {
    it('should convert number to string', () => {
      // Arrange
      const input = 123.45123456789;

      // Act
      const result = transformer.to(input);

      // Assert
      expect(result).toBe('123.45123456789');
      expect(typeof result).toBe('string');
    });

    it('should return string as-is', () => {
      // Arrange
      const input = '123.45';

      // Act
      const result = transformer.to(input);

      // Assert
      expect(result).toBe('123.45');
      expect(typeof result).toBe('string');
    });

    // Avoid breaks values checks

    it('should handle null values', () => {
      // Arrange
      const input = null;

      // Act
      const result = transformer.to(input);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      // Arrange
      const input = undefined;

      // Act
      const result = transformer.to(input);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle negative numbers', () => {
      // Arrange
      const input = -123.45;

      // Act
      const result = transformer.to(input);

      // Assert
      expect(result).toBe('-123.45');
      expect(typeof result).toBe('string');
    });

    it('should handle very large numbers', () => {
      // Arrange - using a number that won't lose precision
      const input = 999999.99;

      // Act
      const result = transformer.to(input);

      // Assert
      expect(result).toBe('999999.99');
      expect(typeof result).toBe('string');
    });

    it('should handle high-precision decimal numbers from database', () => {
      // Arrange - simulating what database might return as a number
      // Using a number that maintains precision in JavaScript
      const input = 123456789.123456;

      // Act
      const result = transformer.to(input);

      // Assert
      expect(result).toBe('123456789.123456');
      expect(typeof result).toBe('string');
    });

    it('should handle very high precision numbers from database', () => {
      // Arrange - simulating database returning high precision number
      // We create the number from a string to avoid precision loss in literal
      const input = Number.parseFloat('999999999.99123456789');

      // Act
      const result = transformer.to(input);

      // Assert
      // Note: JavaScript may lose some precision, but we test the conversion works
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^999999999\.9912345/); // Check it starts correctly
    });

    it('should handle very small numbers', () => {
      // Arrange
      const input = 0.000001;

      // Act
      const result = transformer.to(input);

      // Assert
      expect(result).toBe('0.000001');
      expect(typeof result).toBe('string');
    });
  });

  // Recommended initialization test
  describe('transformer initialization', () => {
    it('should be defined', () => {
      expect(transformer).toBeDefined();
    });

    it('should be an instance of DecimalAsStringTransformer', () => {
      expect(transformer).toBeInstanceOf(DecimalAsStringTransformer);
    });
  });
});
