import type { PushSubscriptionPayload } from '../domain/models';

interface PushSubscriptionJsonLike {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: Record<string, string>;
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = globalThis.atob(base64);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

export function pushSubscriptionPayload(value: PushSubscriptionJsonLike): PushSubscriptionPayload {
  const endpoint = value.endpoint?.trim();
  const p256dh = value.keys?.p256dh;
  const auth = value.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    throw new Error('INVALID_PUSH_SUBSCRIPTION');
  }
  return {
    endpoint,
    expirationTime: value.expirationTime ?? null,
    keys: { p256dh, auth }
  };
}

export async function subscribeMissionPush(publicKey: string): Promise<PushSubscriptionPayload> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('PUSH_NOT_SUPPORTED');
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: bytesToArrayBuffer(urlBase64ToUint8Array(publicKey))
    });
  }
  return pushSubscriptionPayload(subscription.toJSON());
}


export async function unsubscribeMissionPush(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();
}
