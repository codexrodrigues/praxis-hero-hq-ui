export type TacticalClearance = 'DEFCON 1' | 'DEFCON 2';

/** Demo navigation policy only; server authorization remains authoritative. */
export function canAccessTacticalPage(
  current: TacticalClearance | undefined,
  required: string | undefined,
): boolean {
  if (!required) return true;
  if (required !== 'DEFCON 1' && required !== 'DEFCON 2') return false;
  return current === 'DEFCON 1' || (required === 'DEFCON 2' && current === 'DEFCON 2');
}

