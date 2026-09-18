import type { Ref } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from './ScreenContainer';
import { palette } from '@/theme/tokens';
export default function AuthLayout({
  children,
  footer,
  header,
  scrollRef,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  scrollRef?: Ref<ScrollView>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {header && <View style={styles.header}>{header}</View>}
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.content}>{children}</View>
        </ScrollView>
        {footer && (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.footerContent}>{footer}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
const styles = StyleSheet.create({
  header: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 24 },
  footer: {
    padding: 16,
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderColor: palette.border,
  },
  footerContent: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 8 },
});
