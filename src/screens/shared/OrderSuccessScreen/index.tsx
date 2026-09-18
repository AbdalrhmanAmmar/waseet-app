import { CustomText, GradientBtn, ScreenContainer } from '@/components/shared/index';
import LinearGradient from '@/components/shared/LinearGradient';
import { ScreenNames } from '@/navigation/ScreenNames';
import type { ScreenProps } from '@/navigation/use-screen-props';
import { styles } from '@/screens/shared/OrderSuccessScreen/styles';
import { COLORS, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
import { Animated, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// from '@/navigation/ScreenNames';

export default function OrderSuccessScreen({ navigation, route }: ScreenProps) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [bounceAnim] = useState(() => new Animated.Value(0));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduced) {
      bounceAnim.setValue(1);
      fadeAnim.setValue(1);
      return;
    }
    const animation = Animated.parallel([
      Animated.spring(bounceAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [bounceAnim, fadeAnim, reduced]);

  return (
    <ScreenContainer>
      {/* Background decoration */}
      <View style={styles.topCircle} />

      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: bounceAnim }] }]}>
          <LinearGradient colors={[COLORS.secondary, '#2A8A76']} style={styles.iconGradient}>
            <Icon name="check-bold" size={hp(5.6)} color={COLORS.white} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          <CustomText style={styles.title}>تم تقديم الطلب بنجاح!</CustomText>
          <CustomText style={styles.subtitle}>
            {orderId
              ? `تم استلام طلبك رقم #${orderId} وجارٍ معالجته.`
              : 'تم استلام طلبك. يمكنك متابعة تفاصيله من قائمة الطلبات.'}
          </CustomText>

          <View style={styles.statusBadge}>
            <Icon name="clock-outline" size={hp(1.6)} color={COLORS.primary} />
            <CustomText style={styles.statusText}>تابع تحديثات الحالة من قائمة الطلبات</CustomText>
          </View>
        </Animated.View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + hp(2.4) }]}>
        <GradientBtn
          text={'تتبع طلبي'}
          colors={[COLORS.charcoal, '#3a3836']}
          disabled={!orderId}
          onPress={() => navigation.navigate(ScreenNames.TrackOrder, { orderId })}
          leftIcon={<Icon name="arrow-left" size={hp(2.1)} color={COLORS.white} />}
          containerStyle={styles.primaryBtn}
        />

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate(ScreenNames.BottomTabs, { screen: ScreenNames.HomeScreen })
          }
        >
          <CustomText style={styles.secondaryBtnText}>العودة للرئيسية</CustomText>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
