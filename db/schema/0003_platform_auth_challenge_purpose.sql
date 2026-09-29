-- =============================================================================
-- JETHUR DPDP · PLATFORM · auth_challenge.purpose gains 'password_reset_verified'
-- =============================================================================
-- The password-recovery flow exchanges a verified OTP challenge for a short-lived
-- reset-token challenge IN PLACE (src/server/auth/password-recovery.ts), rewriting
-- `purpose` to 'password_reset_verified'. 0001 did not allow that value, so the
-- exchange violated the CHECK. Caught by tooling/scripts/check-db-schema.mjs.
--
-- Postgres names an inline column CHECK `<table>_<column>_check`.
-- =============================================================================

ALTER TABLE auth_challenge DROP CONSTRAINT auth_challenge_purpose_check;
ALTER TABLE auth_challenge ADD CONSTRAINT auth_challenge_purpose_check
  CHECK (purpose IN (
    'signin_link',
    'signin_otp',
    'password_reset',
    'password_reset_verified',
    'email_verify',
    'phone_verify',
    'invite'
  ));
