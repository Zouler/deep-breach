import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/theme';
import type { GameEvent } from '@/types';

type Props = { events: GameEvent[]; max?: number };

export function DiveEventStrip({ events, max = 3 }: Props) {
  const slice = events.slice(-max).reverse();
  if (!slice.length) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Recent events</Text>
      {slice.map((e) => (
        <Text key={e.id} style={styles.line} numberOfLines={2}>
          {formatTag(e.type)} {e.message}
        </Text>
      ))}
    </View>
  );
}

function formatTag(type: GameEvent['type']): string {
  switch (type) {
    case 'pressure_spike':
      return '▲';
    case 'repair_complete':
      return '✓';
    case 'repair_failed':
      return '✗';
    case 'loot_secured':
      return '◆';
    case 'system_failure':
      return '!';
    case 'external_discovery':
      return '◎';
    case 'discovery_ignored':
      return '⊘';
    case 'discovery_recovery':
      return '⚙';
    case 'sonar_contact':
      return '~';
    case 'bio_signature':
      return '⁂';
    case 'wreck_sighting':
      return '⚓';
    case 'special_signal':
      return '※';
    default:
      return '·';
  }
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: '#071a33',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  title: { color: theme.textMuted, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  line: { color: theme.text, fontSize: 13, lineHeight: 18 },
});
