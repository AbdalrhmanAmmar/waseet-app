import { useEffect } from 'react';
import { ActivityIndicator, AppState, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import Text from '@/components/shared/CustomText';
import { Button } from '@/components/shared/ui';
import { palette as p } from '@/theme/tokens';
export type VideoProps = { uri: string; active: boolean; retry: () => void };
/** Mounted only after the user explicitly presses play. */
export function ProductVideo({ uri, active, retry }: VideoProps) {
  const player = useVideoPlayer(uri);
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useEffect(() => {
    player.play();
  }, [player]);
  useEffect(() => {
    if (!active) player.pause();
  }, [active, player]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') player.pause();
    });
    return () => subscription.remove();
  }, [player]);
  return (
    <View style={s.box}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
        accessibilityLabel="فيديو المنتج"
      />
      {status === 'loading' && (
        <View pointerEvents="none" style={s.cover}>
          <ActivityIndicator color={p.primary} />
          <Text>جارٍ تحميل الفيديو…</Text>
        </View>
      )}
      {status === 'error' && (
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
