import { createContext, useCallback, useContext, useEffect, useRef, type RefObject } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from '@/components/shared/ScreenContainer';
import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { palette as p } from '@/theme/tokens';
const FocusContext = createContext<(input: TextInput) => void>(() => {});
export const useAuthFieldFocus = () => useContext(FocusContext);

export default function AuthFormLayout({
  children,
  header,
  footer,
  scrollRef,
  centered = false,
  testID,
  contentStyle,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scrollRef?: RefObject<ScrollView | null>;
  centered?: boolean;
  testID?: string;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const internalScroll = useRef<ScrollView>(null);
  const scroll = scrollRef ?? internalScroll;
  const viewport = useRef<View>(null);
  const activeInput = useRef<TextInput | null>(null);
  const offset = useRef(0);
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const reveal = useCallback(() => {
    const input = activeInput.current;
    if (!input?.isFocused()) return;
    viewport.current?.measureInWindow((_x, top, _width, height) => {
      input.measureInWindow((_left, y, _inputWidth, inputHeight) => {
        if (activeInput.current !== input || !input.isFocused()) return;
        const bottom = Math.min(top + height, Keyboard.metrics?.()?.screenY ?? Infinity);
        const delta =
          y + inputHeight + 38 > bottom
            ? y + inputHeight + 38 - bottom
            : y < top + 12
              ? y - top - 12
              : 0;
        if (delta)
          scroll.current?.scrollTo({
            y: Math.max(0, offset.current + delta),
            animated: !reducedMotion,
          });
      });
    });
  }, [reducedMotion, scroll]);
  const focus = useCallback(
    (input: TextInput) => {
      activeInput.current = input;
      requestAnimationFrame(reveal);
    },
    [reveal],
  );
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', reveal);
    const changed = Keyboard.addListener('keyboardDidChangeFrame', reveal);
    return () => {
      shown.remove();
      changed.remove();
    };
  }, [reveal]);
  return (
    <ScreenContainer backgroundColor={p.background} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header && <View style={s.header}>{header}</View>}
        <FocusContext.Provider value={focus}>
          <View ref={viewport} style={s.flex} onLayout={reveal}>
            <ScrollView
              ref={scroll}
              testID={testID}
              style={s.flex}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
              showsVerticalScrollIndicator={false}
              onScroll={(event) => {
                offset.current = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              contentContainerStyle={[
                s.scroll,
                centered && s.centered,
                { paddingBottom: footer ? 24 : Math.max(insets.bottom, 24) },
              ]}
            >
              <View style={[s.content, contentStyle]}>{children}</View>
            </ScrollView>
          </View>
        </FocusContext.Provider>
        {footer && (
          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={s.content}>{footer}</View>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
const s = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 14 },
  centered: { justifyContent: 'center', paddingTop: 24 },
  content: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 16 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: p.border,
  },
});
