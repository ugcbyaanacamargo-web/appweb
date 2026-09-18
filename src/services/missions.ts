import type { Mission } from '../domain/models';
import type { OrisDb } from '../infrastructure/db';
import type { GatewayContext, OrisGateway } from '../infrastructure/orisGateway';

export async function completeMissionOffline(
  db: OrisDb,
  mission: Mission,
  patch: Partial<Pick<Mission, 'notes' | 'evidence' | 'latitude' | 'longitude'>>,
  now: string
): Promise<Mission> {
  const completed: Mission = {
    ...mission,
    ...patch,
    completed: true,
    pendingReturn: true,
    completedAt: now
  };
  await db.missions.put(completed);
  return completed;
}

export async function flushMissionReturns(input: {
  db: OrisDb;
  gateway: OrisGateway;
  context: GatewayContext;
  online: boolean;
}): Promise<number> {
  const { db, gateway, context, online } = input;
  if (!online) return 0;

  const pending = (await db.missions
    .where('scopeKey')
    .equals(context.scopeKey)
    .toArray())
    .filter(mission => mission.pendingReturn);

  let sent = 0;
  for (const mission of pending) {
    try {
      await gateway.sendMissionReturn(context, mission);
      await db.missions.put({ ...mission, pendingReturn: false });
      sent += 1;
    } catch {
      // Mission returns are independent: keep this one pending and continue.
    }
  }
  return sent;
}
