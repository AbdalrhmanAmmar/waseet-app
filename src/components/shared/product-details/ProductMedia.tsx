import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductVideo } from './ProductVideo';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import Text from '@/components/shared/CustomText';
import { palette as p, typography as t } from '@/theme/tokens';
export function ProductMedia({
  image,
  video,
  title,
  active,
}: {
  image?: string;
  video?: string;
  title: string;
  active: boolean;
}) {
  const [mode, setMode] = useState<'image' | 'video'>('image');
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [started, setStarted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const retryImage = () => {
    setFailed(false);
    setAttempt((value) => value + 1);
  };
  const photo =
    image && !failed ? (
      <Image
        key={attempt}
        source={{ uri: image }}
        onError={() => setFailed(true)}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        accessibilityLabel={title}
      />
    ) : (
      <View style={s.center}>
        <Icon name="image-off-outline" size={40} color={p.muted} />
        <Text style={s.hint}>{image ? 'تعذر تحميل الصورة' : 'لا توجد صورة لهذا المنتج'}</Text>
        {!!image && (
          <Pressable accessibilityRole="button" onPress={retryImage} style={s.retry}>
            <Text style={s.link}>إعادة محاولة الصورة</Text>
          </Pressable>
        )}
      </View>
    );
  return (
    <View style={s.wrapper}>
      {mode === 'video' && video && started ? (
        <ProductVideo
          key={`${video}-${attempt}`}
          uri={video}
          active={active}
          retry={() => setAttempt((value) => value + 1)}
        />
      ) : (
        <View style={s.hero}>
          {photo}
          {mode === 'video' ? (
            <View style={s.playOverlay}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تشغيل فيديو المنتج"
                onPress={() => setStarted(true)}
                style={s.play}
              >
                <Icon name="play" size={35} color="#fff" />
              </Pressable>
              <Text style={s.playHint}>يبدأ التشغيل عند الضغط</Text>
            </View>
          ) : (
            !!image &&
            !failed && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="تكبير صورة المنتج"
                onPress={() => {
                  setZoom(1);
                  setExpanded(true);
                }}
                style={s.expand}
              >
                <Icon name="arrow-expand" size={25} color="#fff" />
              </Pressable>
            )
          )}
        </View>
      )}
      {!!video && (
        <View style={s.tabs}>
          {(['image', 'video'] as const).map((tab) => (
            <Pressable
              key={tab}
              accessibilityRole="radio"
              aria-checked={mode === tab}
              accessibilityLabel={tab === 'image' ? 'الصورة' : 'الفيديو'}
              onPress={() => {
                setMode(tab);
                setStarted(false);
              }}
              style={[s.tab, mode === tab && s.selected]}
            >
              <Icon
                name={tab === 'image' ? 'image-outline' : 'play'}
                size={21}
                color={mode === tab ? p.primary : p.muted}
              />
              <Text style={s.link}>{tab === 'image' ? 'الصورة' : 'الفيديو'}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Modal visible={expanded} onRequestClose={() => setExpanded(false)} animationType="none">
        <View
          style={[s.viewer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
          accessibilityViewIsModal
        >
          <View style={s.viewerTools}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="إغلاق الصورة"
              onPress={() => setExpanded(false)}
              style={s.tool}
            >
              <Icon name="close" size={26} color="#fff" />
            </Pressable>
            <Text style={s.viewerTitle} numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تصغير الصورة"
              disabled={zoom <= 1}
              onPress={() => setZoom(Math.max(1, zoom - 0.5))}
              style={s.tool}
            >
              <Icon name="magnify-minus-outline" size={26} color="#fff" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تكبير أكثر"
              disabled={zoom >= 3}
              onPress={() => setZoom(Math.min(3, zoom + 0.5))}
              style={s.tool}
            >
              <Icon name="magnify-plus-outline" size={26} color="#fff" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <ScrollView horizontal contentContainerStyle={{ alignItems: 'center' }}>
              {image && (
                <Image
                  source={{ uri: image }}
                  resizeMode="contain"
                  accessibilityLabel={`صورة مكبرة: ${title}`}
                  style={{
                    width: width * zoom,
                    height: Math.max(200, height - insets.top - insets.bottom - 60) * zoom,
                  }}
                />
              )}
            </ScrollView>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  wrapper: { gap: 9 },
  hero: {
    width: '100%',
    aspectRatio: 1.05,
    maxHeight: 410,
    backgroundColor: '#EEF1EA',
    borderRadius: 19,
    overflow: 'hidden',
  },
  center: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EEF1EA',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    padding: 20,
  },
  hint: { color: p.muted, fontSize: 13, textAlign: 'center' },
  retry: { padding: 12, minHeight: 44 },
  link: { color: p.primary, fontFamily: t.bold, fontSize: 14 },
  expand: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#183E3299',
  },
  tabs: { flexDirection: 'row-reverse', gap: 8 },
  tab: {
    flex: 1,
    minHeight: 45,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: p.border,
    backgroundColor: '#F2F4F0',
  },
  selected: { borderColor: p.primary, backgroundColor: '#EAF6EF' },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000020',
  },
  play: {
    height: 70,
    width: 70,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17392F77',
  },
  playHint: {
    color: '#fff',
    fontSize: 12,
    backgroundColor: '#17392F99',
    borderRadius: 8,
    padding: 6,
    marginTop: 12,
  },
  viewer: { flex: 1, backgroundColor: '#0D1F1A' },
  viewerTools: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 10,
    minHeight: 56,
  },
  tool: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  viewerTitle: { flex: 1, color: '#fff', fontFamily: t.bold, fontSize: 16 },
});
