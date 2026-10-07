import { z, ZodSchema } from 'zod';

/**
 * Universal validation helper for API request bodies.
 * Provides clean error messaging and type inference.
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const pathStr = firstIssue.path.length > 0 ? `[${firstIssue.path.join('.')}] ` : '';
    const errorMsg = `${pathStr}${firstIssue.message}`;
    return {
      success: false,
      error: errorMsg,
      issues: result.error.issues,
    };
  }
  return { success: true, data: result.data };
}

export * from './sales';
export * from './productions';
export * from './purchases';
