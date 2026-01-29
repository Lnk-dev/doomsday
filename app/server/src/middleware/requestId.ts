/**
 * Request ID Middleware
 *
 * Generates unique request IDs for all incoming requests.
 * Enables end-to-end tracing for debugging and security forensics.
 */

import { createMiddleware } from 'hono/factory'
import type { Context } from 'hono'
import { randomUUID } from 'crypto'

const REQUEST_ID_HEADER = 'X-Request-ID'

/**
 * Generate a unique request ID
 * Uses UUID v4 for uniqueness
 */
function generateRequestId(): string {
  return randomUUID()
}

/**
 * Request ID middleware
 *
 * - Accepts existing request ID from client header (for distributed tracing)
 * - Generates new ID if not provided
 * - Adds request ID to response headers
 * - Makes request ID available in context via c.get('requestId')
 */
export const requestId = createMiddleware(async (c: Context, next: () => Promise<void>) => {
  // Check for existing request ID from upstream service or client
  let id = c.req.header(REQUEST_ID_HEADER)

  // Validate format if provided (must be UUID-like for security)
  if (id && !/^[a-f0-9-]{36}$/i.test(id)) {
    // Invalid format, generate new ID
    id = undefined
  }

  // Generate new ID if not provided or invalid
  if (!id) {
    id = generateRequestId()
  }

  // Store in context for use by other middleware and handlers
  c.set('requestId', id)

  // Add to response headers
  c.header(REQUEST_ID_HEADER, id)

  await next()
})

/**
 * Get request ID from context (type-safe helper)
 */
export function getRequestId(c: Context): string | undefined {
  return c.get('requestId') as string | undefined
}
