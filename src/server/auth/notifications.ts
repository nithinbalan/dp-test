/**
 * Notification dispatch for auth challenges (password reset OTP, verification links).
 * Provides a mock/logged provider in development and test environments, and an
 * extensible interface for production transactional providers.
 */
import { env } from '@shared/config';
import { logger } from '@shared/lib/logger';

/** Delivery channel for recovery challenges. */
export type NotificationChannel = 'email' | 'whatsapp';

/** Pluggable interface for delivering authentication challenges and OTPs. */
export type NotificationProvider = {
  sendPasswordResetOtp(
    recipient: string,
    channel: NotificationChannel,
    code: string,
  ): Promise<void>;
};

class LoggedNotificationProvider implements NotificationProvider {
  sendPasswordResetOtp(
    recipient: string,
    channel: NotificationChannel,
    code: string,
  ): Promise<void> {
    // Dev/test stand-in only — an OTP is a short-lived secret and must never reach a
    // production log. Swap in a real provider (setNotificationProvider) before ship.
    if (env.NODE_ENV !== 'production') {
      logger.info('Auth notification (dev stand-in provider)', { channel, recipient, code });
    }
    return Promise.resolve();
  }
}

let notificationProviderInstance: NotificationProvider = new LoggedNotificationProvider();

/** Registers a custom notification provider for production or integration testing. */
export function setNotificationProvider(provider: NotificationProvider): void {
  notificationProviderInstance = provider;
}

/** Retrieves the currently active notification provider instance. */
export function getNotificationProvider(): NotificationProvider {
  return notificationProviderInstance;
}
