import { Pressable, StyleSheet, Text, View, type ImageSourcePropType, type PressableProps, type ViewStyle } from 'react-native';

import { SafeIcon } from '@/components/SafeIcon';
import { theme } from '@/constants/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
  /** Optional leading icon (mobile-game affordance). */
  iconLeft?: ImageSourcePropType;
  iconLeftSize?: number;
};

export function PrimaryButton({
  title,
  variant = 'primary',
  style,
  iconLeft,
  iconLeftSize = 22,
  ...rest
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        pressed && { opacity: 0.85 },
        style,
      ]}
      {...rest}
    >
      <View style={styles.inner}>
        {iconLeft ? (
          <SafeIcon source={iconLeft} size={iconLeftSize} style={{ marginRight: 10 }} />
        ) : null}
        <Text
          style={[
            styles.text,
            variant === 'ghost' && { color: theme.text },
            variant === 'danger' && { color: '#fff' },
          ]}
        >
          {title}
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
  },
  base: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  primary: {
    backgroundColor: theme.accentDim,
    borderColor: theme.accent,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: theme.border,
  },
  danger: {
    backgroundColor: '#7f1d1d',
    borderColor: theme.danger,
  },
  text: { color: theme.text, fontWeight: '700', letterSpacing: 0.3 },
});
