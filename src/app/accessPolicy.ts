export function canEnterCompanyContext(
  online: boolean,
  lastSuccessfulSyncAt?: string
): boolean {
  return online || Boolean(lastSuccessfulSyncAt);
}
