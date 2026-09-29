/**
 * Password reset code verification Route Handler.
 * Verifies the 6-digit recovery OTP code and mints a short-lived reset token.
 */
import { z } from 'zod';
import { verifyResetCode } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';

const verifySchema = z.object({
  identifier: z.string().min(1),
  code: z.string().min(1),
});

export const POST = defineRoute(async ({ request, requestId }) => {
  const body = await parseJsonBody(request, verifySchema);
  if (!body.ok) {
    return errorResponse(body.error, requestId);
  }

  const result = await verifyResetCode(body.value.identifier, body.value.code);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }

  return dataResponse({ resetToken: result.value.resetToken });
});
