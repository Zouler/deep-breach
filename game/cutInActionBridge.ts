import type { CrewAlertAction } from '@/types/crewAlerts';
import type { CutInNavAction, NarrativeCutIn } from '@/types/cutins';

function fromLegacyNav(a: CutInNavAction): CrewAlertAction {
  switch (a.id) {
    case 'open_scan':
      return { id: a.id, label: a.label, type: 'open_sonar', style: 'primary' };
    case 'open_repairs':
      return { id: a.id, label: a.label, type: 'open_repairs', style: 'primary' };
    case 'return_to_base':
      return { id: a.id, label: a.label, type: 'return_to_base', style: 'danger' };
    case 'search_salvage':
      return {
        id: a.id,
        label: a.label,
        type: 'set_command_intent',
        payload: { commandIntent: 'search_salvage' },
        style: 'primary',
      };
    default:
      return { id: a.id, label: a.label, type: 'acknowledge' };
  }
}

/** Merge modern `actions` with legacy `extraActions` on narrative cut-ins. */
export function resolveNarrativeCutInActions(cutIn: NarrativeCutIn | null): CrewAlertAction[] {
  if (!cutIn) return [];
  if (cutIn.actions?.length) return cutIn.actions;
  const legacy = cutIn.extraActions ?? [];
  return legacy.map(fromLegacyNav);
}
