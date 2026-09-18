import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import AuthLayout from '@/components/shared/AuthLayout';
import Text from '@/components/shared/CustomText';
import { Brand, Button, ui } from '@/components/shared/ui';
import { useAppDispatch } from '@/hooks/shared/use-store';
import { setFirst } from '@/store/slices/auth';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { palette as p, typography as t } from '@/theme/tokens';
import Images from '@/theme/images';
const slides = [
  {
    title: 'تجارتك تبدأ من هنا',
    text: 'اكتشف المنتجات وجهّز طلبات عملائك في تجربة واحدة واضحة.',
    icon: 'storefront-outline' as const,
    tag: 'منتجات ومبيعات',
  },
  {
    title: 'كل طلب، خطوة بخطوة',
    text: 'تابع تفاصيل الطلب وتحديثات حالته، من الإنشاء وحتى التوصيل.',
    icon: 'package-variant-closed' as const,
    tag: 'متابعة الطلبات',
  },
  {
    title: 'فريق واحد. عمل منظم.',
    text: 'مساحة مناسبة للتاجر وموظف المبيعات والإدارة ومندوب التوصيل.',
    icon: 'account-group-outline' as const,
    tag: 'أربعة أدوار متكاملة',
  },
];
export default function OnboardingScreen({ navigation }: ScreenProps) {
  const [index, setIndex] = useState(0);
  const dispatch = useAppDispatch();
  const finish = () => {
    dispatch(setFirst());
    navigation.replace('Login');
  };
  const slide = slides[index];
  return (
    <AuthLayout
      header={
        <View style={ui.section}>
          <Brand compact />
          <Pressable accessibilityRole="button" onPress={finish}>
            <Text style={ui.link}>تخطي</Text>
          </Pressable>
        </View>
      }
      footer={
        <Button
          title={index === slides.length - 1 ? 'ابدأ الآن' : 'التالي'}
          onPress={() => (index === slides.length - 1 ? finish() : setIndex(index + 1))}
          icon="arrow-left"
        />
      }
    >
      <View style={s.art}>
        <View style={s.orbit}>
          <Image source={Images.brandLogo} style={s.logo} />
        </View>
        <View style={s.tag}>
          <Icon name={slide.icon} size={23} color={p.primary} />
          <Text style={ui.link}>{slide.tag}</Text>
        </View>
      </View>
      <View style={s.dots}>
        {slides.map((_, i) => (
          <View key={i} style={[s.dot, i === index && s.active]} />
        ))}
      </View>
      <Text style={s.title}>{slide.title}</Text>
      <Text style={s.text}>{slide.text}</Text>
      <Text style={[ui.caption, { textAlign: 'center' }]}>وسيط · تفاصيل أقل، إنجاز أكثر</Text>
    </AuthLayout>
  );
}
const s = StyleSheet.create({
  art: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: p.soft,
    borderRadius: 32,
    padding: 28,
    gap: 20,
  },
  orbit: {
    borderWidth: 1,
    borderColor: '#C6DFD0',
    borderRadius: 120,
    padding: 28,
    backgroundColor: '#F8FAF7',
  },
  logo: { width: 120, height: 120 },
  tag: {
    flexDirection: 'row-reverse',
    backgroundColor: p.surface,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 10,
    alignItems: 'center',
  },
  dots: { flexDirection: 'row-reverse', gap: 6, justifyContent: 'center' },
  dot: { width: 7, height: 7, borderRadius: 7, backgroundColor: p.border },
  active: { width: 28, backgroundColor: p.primary },
  title: { fontSize: 30, lineHeight: 42, fontFamily: t.bold, textAlign: 'center' },
  text: { color: p.muted, fontSize: 17, lineHeight: 30, textAlign: 'center' },
});
