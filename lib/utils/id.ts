import { nanoid } from 'nanoid';

/**
 * Generate a unique ID for categories and attributes.
 * Uses nanoid with default length (21 chars).
 */
export function generateId(): string {
  return nanoid();
}
