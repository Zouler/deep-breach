import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { SafeIcon } from '@/components/SafeIcon';
import { theme } from '@/constants/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
  iconLeft?: ImageSourcePropType;
  iconLeftSize?: number;
  /** When false, label keeps original casing (e.g. proper nouns). Default true. */
  uppercase?: boolean;
};

export function PrimaryButton({
  title,
  variant = 'primary',
  style,
  iconLeft,
  iconLeftSize = 22,
  uppercase = true,
  ...rest
}: Props) {
  const label = uppercase ? title.toUpperCase() : title;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}
    >
      {variant === 'primary' ? <View style={styles.statusTick} /> : null}
      <View style={styles.inner}>
        {iconLeft ? (
          <SafeIcon source={iconLeft} size={iconLeftSize} style={{ marginRight: 10 }} />
        ) : null}
        <Text
          style={[
            styles.text,
            variant === 'ghost' && styles.textGhost,
            variant === 'danger' && styles.textDanger,
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  base: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 46,
    borderRadius: theme.radiusInstrument,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statusTick: {
    width: 4,
    backgroundColor: theme.instrumentCyan,
  },
  primary: {
    backgroundColor: theme.panelRailBg,
    borderColor: theme.instrumentCyan,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: theme.mutedSteel,
  },
  danger: {
    backgroundColor: '#450a0acc',
    borderColor: theme.emergencyRed,
  },
  pressed: { opacity: 0.88 },
  text: {
    color: theme.instrumentCyan,
    fontFamily: theme.fontMono,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.1,
  },
  textGhost: { color: theme.paperBone },
  textDanger: { color: '#fecaca' },
});
