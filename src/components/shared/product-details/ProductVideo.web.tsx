import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Text from '@/components/shared/CustomText';
import { Button } from '@/components/shared/ui';
import { palette as p } from '@/theme/tokens';
// Same public contract as the native Expo player; HTML video provides browser-native controls.
type VideoProps = { uri: string; active: boolean; retry: () => void };
export function ProductVideo({ uri, active, retry }: VideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!active) ref.current?.pause();
  }, [active]);
  useEffect(() => {
    const element = ref.current;
    const pause = () => {
      if (document.hidden) element?.pause();
    };
    document.addEventListener('visibilitychange', pause);
    return () => {
      element?.pause();
      document.removeEventListener('visibilitychange', pause);
    };
  }, []);
  return (
    <View style={s.box}>
      <video
        ref={ref}
        src={uri}
        controls
        autoPlay
        playsInline
        aria-label="فيديو المنتج"
        onLoadedData={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {loading && (
        <View pointerEvents="none" style={s.cover}>
          <ActivityIndicator color={p.primary} />
          <Text>جارٍ تحميل الفيديو…</Text>
        </View>
      )}
      {error && (
        <View style={s.cover}>
          <Text accessibilityRole="alert">تعذر تشغيل الفيديو</Text>
          <Button title="إعادة محاولة الفيديو" onPress={retry} secondary />
        </View>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  box: {
    width: '100%',
    aspectRatio: 1.05,
    maxHeight: 410,
    backgroundColor: '#EEF1EA',
    borderRadius: 19,
    overflow: 'hidden',
  },
  cover: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF1EA',
    gap: 12,
    padding: 20,
  },
});
