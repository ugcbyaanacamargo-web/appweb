import { describe, expect, it } from 'vitest';
import { pushSubscriptionPayload, urlBase64ToUint8Array } from './push';

describe('push helpers', () => {
  it('converts URL-safe VAPID base64 into bytes', () => {
    expect(Array.from(urlBase64ToUint8Array('AQIDBA'))).toEqual([1, 2, 3, 4]);
  });

  it('normalizes a browser subscription into the gateway payload', () => {
    const payload = pushSubscriptionPayload({
      endpoint: 'https://push.example/subscription',
      expirationTime: null,
      keys: { p256dh: 'public-key', auth: 'auth-key' }
    });
    expect(payload).toEqual({
      endpoint: 'https://push.example/subscription',
      expirationTime: null,
      keys: { p256dh: 'public-key', auth: 'auth-key' }
    });
  });

  it('rejects subscriptions without Web Push keys', () => {
    expect(() => pushSubscriptionPayload({
      endpoint: 'https://push.example/subscription',
      expirationTime: null,
      keys: {}
    })).toThrow('INVALID_PUSH_SUBSCRIPTION');
  });
});
