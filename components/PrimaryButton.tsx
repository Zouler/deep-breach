import { Pressable, StyleSheet, Text, type PressableProps, type ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
};

export function PrimaryButton({ title, variant = 'primary', style, ...rest }: Props) {
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
      <Text
        style={[
          styles.text,
          variant === 'ghost' && { color: theme.text },
          variant === 'danger' && { color: '#fff' },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
