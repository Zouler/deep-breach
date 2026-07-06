import { StyleSheet, Text, View } from 'react-native';

import { SafeIcon } from '@/components/SafeIcon';
import { monoData, theme } from '@/constants/theme';
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
        <Text style={styles.label}>{label.toUpperCase()}</Text>
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
    borderLeftColor: theme.instrumentCyan,
    paddingLeft: 10,
    marginLeft: -2,
  },
  icon: { marginRight: 2 },
  textCol: { flex: 1 },
  label: { color: theme.mutedSteel, fontSize: 10, marginBottom: 2, letterSpacing: 0.5 },
  value: { color: theme.paperBone, fontWeight: '700', ...monoData, fontSize: 15 },
});
