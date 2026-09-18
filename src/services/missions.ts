import type { Mission } from '../domain/models';
import type { OrisDb } from '../infrastructure/db';
import type { GatewayContext, OrisGateway } from '../infrastructure/orisGateway';

export async function completeMissionOffline(
  _db: OrisDb,
  mission: Mission,
  _patch: Partial<Pick<Mission, 'notes' | 'evidence' | 'latitude' | 'longitude'>>,
  _now: string
): Promise<Mission> {
  return mission;
}

export async function flushMissionReturns(_input: {
  db: OrisDb;
  gateway: OrisGateway;
  context: GatewayContext;
  online: boolean;
}): Promise<number> {
  return 0;
}
