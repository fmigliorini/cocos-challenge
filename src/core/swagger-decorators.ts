import { ApiProperty } from "@nestjs/swagger";

/**
 * userIdApiProperty
 * This decorator is used to add the user ID to the API property.
 * 
 * @param required - Whether the user ID is required.
 * 
 * @returns The API property.
 */
export const userIdApiProperty = (required: boolean = true) => ApiProperty({
  required,
  description: 'The user ID',
  example: '1',
});
