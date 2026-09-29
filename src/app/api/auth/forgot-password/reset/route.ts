/**
 * Password reset finalization Route Handler.
 * Applies the new password and invalidates all existing sessions.
 */
import { z } from 'zod';
import { resetPassword } from '@server/auth';
import { errorResponse } from '@server/errors';
import { dataResponse, defineRoute, parseJsonBody } from '@server/http';

const resetSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(1),
});

export const POST = defineRoute(async ({ request, requestId }) => {
  const body = await parseJsonBody(request, resetSchema);
  if (!body.ok) {
    return errorResponse(body.error, requestId);
  }

  const result = await resetPassword(body.value.resetToken, body.value.newPassword);
  if (!result.ok) {
    return errorResponse(result.error, requestId);
  }

  return dataResponse({ success: true });
});
