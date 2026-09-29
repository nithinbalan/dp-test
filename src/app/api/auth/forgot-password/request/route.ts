/**
 * Password reset request Route Handler.
 * Generates and dispatches a 6-digit recovery OTP code.
 */
import { z } from 'zod';
import { requestPasswordReset } from '@server/auth';
import { getClientIp } from '@server/auth/ip';
import { checkRateLimit } from '@server/auth/rate-limit';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';

const requestSchema = z.object({
  identifier: z.string().min(1),
  channel: z.enum(['email', 'whatsapp']).default('email'),
});

// Anti-enumeration always returns ok(), so without a throttle here this endpoint is
// an unlimited email/WhatsApp OTP bomb against any identifier. See
// docs/SECURITY_HYGIENE.md §5.
const IP_LIMIT = 20;
const IDENTIFIER_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export const POST = defineRoute(async ({ request, requestId }) => {
  const ip = getClientIp(request);
  if (ip && !checkRateLimit(`reset-request:ip:${ip}`, IP_LIMIT, WINDOW_MS)) {
    return errorResponse('RATE_LIMITED', requestId);
  }

  const body = await parseJsonBody(request, requestSchema);
  if (!body.ok) {
    return errorResponse(body.error, requestId);
  }

  const identifierKey = body.value.identifier.trim().toLowerCase();
  if (!checkRateLimit(`reset-request:identifier:${identifierKey}`, IDENTIFIER_LIMIT, WINDOW_MS)) {
    return errorResponse('RATE_LIMITED', requestId);
  }

  const result = await requestPasswordReset(body.value.identifier, body.value.channel);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }

  return dataResponse({ success: true });
});
