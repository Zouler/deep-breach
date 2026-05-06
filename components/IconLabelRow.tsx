import { StyleSheet, Text, View } from 'react-native';

import { SafeIcon } from '@/components/SafeIcon';
import { theme } from '@/constants/theme';
import type { ImageSourcePropType } from 'react-native';

type Props = {
  icon: ImageSourcePropType;
  iconSize?: number;
  label: string;
  value: string;
  emphasize?: boolean;
};

export function IconLabelRow({
  icon,
  iconSize = 22,
  label,
  value,
  emphasize,
}: Props) {
  return (
    <View style={[styles.row, emphasize && styles.rowEmph]}>
      <SafeIcon source={icon} size={iconSize} style={styles.icon} />
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  rowEmph: {
    borderLeftWidth: 3,
    borderLeftColor: theme.accent,
    paddingLeft: 10,
    marginLeft: -2,
  },
  icon: { marginRight: 2 },
  textCol: { flex: 1 },
  label: { color: theme.textMuted, fontSize: 12, marginBottom: 2 },
  value: { color: theme.text, fontWeight: '700' },
});
