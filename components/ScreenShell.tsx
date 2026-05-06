import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { theme } from '@/constants/theme';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
};

export function ScreenShell({ children, scroll, contentStyle }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.scroll, contentStyle]}>{children}</ScrollView>
      ) : (
        <View style={[styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.bg },
  fill: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  scroll: { paddingHorizontal: 18, paddingBottom: 32, paddingTop: 8, gap: 14 },
});
