import { ValueTransformer } from 'typeorm';

/**
 * Why string? Avoids JS floating point precision issues.
 * Later swap to decimal(.js) if needed.
 */
export class DecimalAsStringTransformer implements ValueTransformer {
  to(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    return typeof value === 'number' ? value.toString() : value;
  }
  from(value: string | null): string | null {
    return value;
  }
}
