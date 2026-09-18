import type { OrisGateway } from './orisGateway';
import { DemoOrisGateway } from './demoOrisGateway';

export const GATEWAY_MODE = 'demo' as const;

/**
 * Single composition point for the external Óris360° integration.
 *
 * When the real API is ready, implement an OrisGateway adapter and replace
 * the returned instance here. Domain, offline storage and UI do not need
 * to know endpoint URLs or transport details.
 */
export function createOrisGateway(): OrisGateway {
  return new DemoOrisGateway();
}
