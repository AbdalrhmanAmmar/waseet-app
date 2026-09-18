import { CustomText } from '@/components/shared/index';
import { ScreenNames } from '@/navigation/ScreenNames';
import { styles } from '@/screens/auth/OnboardingScreen/styles';
import { setFirst } from '@/store/slices/auth';
import { COLORS, Images, hp } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useRef, useState } from 'react';
import { FlatList, Image, ImageBackground, StatusBar, TouchableOpacity, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

const SLIDES = [
  {
    id: '1',
    image: { uri: 'https://i.pinimg.com/736x/fd/15/be/fd15be3c9a5efe139aa08d56d08c3813.jpg' },
    tag: '💰 الربح بمرونة',
    title: 'بيع بطريقتك الخاصة',
    subtitle: 'حدد أسعارك الخاصة وتحكم في أرباحك بكل سهولة ومرونة.',
    icon: 'cash-multiple',
    iconColor: COLORS.mainOrange,
  },
  {
    id: '2',
    image: { uri: 'https://i.pinimg.com/736x/21/51/8b/21518bffab32ab139a46349110ed4417.jpg' },
    tag: '📦 تنظيم الطلبات',
    title: 'إدارة الطلبات بسهولة',
    subtitle: 'أضف المنتجات، خصص الأسعار، وأنشئ الطلبات في ثوانٍ معدودة.',
    icon: 'cart-check',
    iconColor: COLORS.mainOrange,
  },
  {
    id: '3',
    image: { uri: 'https://i.pinimg.com/736x/bb/c3/d8/bbc3d8d87d7e98565f8a01cbffd2207e.jpg' },
    tag: '👤 تتبع العملاء',
    title: 'تتبع عملائك بدقة',
    subtitle: 'نظم مبيعاتك مع تتبع أسماء العملاء ومواقعهم الجغرافية بكل احترافية.',
    icon: 'account-search',
    iconColor: COLORS.mainOrange,
  },
  {
    id: '4',
    image: { uri: 'https://i.pinimg.com/736x/bc/d1/17/bcd117deaf1d48b876518eaa451361a6.jpg' },
    tag: '💳 المحفظة الذكية',
    title: 'تحكم في محفظتك المالية',
    subtitle: 'أدر رصيدك ومبيعاتك عبر عملات متعددة بكل سهولة وأمان.',
    icon: 'wallet',
    iconColor: COLORS.mainOrange,
  },
];

const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [key, setKey] = useState(0);
  const dispatch: any = useDispatch();

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setKey((k) => k + 1);
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      dispatch(setFirst());
      navigation.replace(ScreenNames.Login);
    }
  };

  const goSkip = () => {
    dispatch(setFirst());
    navigation.replace(ScreenNames.Login);
  };
  const slide = SLIDES[currentIndex];

  return (
    <ImageBackground source={Images.auth_bg} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

        <TouchableOpacity style={[styles.skipBtn, { top: insets.top + hp(1.4) }]} onPress={goSkip}>
          <CustomText style={styles.skipText}>تخطي</CustomText>
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.activeCardWrapper}>
            <FlatList
              ref={flatListRef}
              data={SLIDES}
              horizontal
              pagingEnabled
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <View style={styles.cardContainer}>
                  <Animatable.View
                    key={key}
                    animation="zoomIn"
                    duration={800}
                    style={styles.activeCard}
                  >
                    <Image source={item.image} style={styles.cardImage} resizeMode="cover" />
                    <Animatable.View animation="fadeInUp" delay={400} style={styles.cardBadge}>
                      <CustomText style={styles.cardBadgeText}>{item.tag}</CustomText>
                    </Animatable.View>
                  </Animatable.View>
                </View>
              )}
            />
          </View>

          <View style={styles.textSection}>
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
              ))}
            </View>

            <Animatable.View
              key={`text-${key}`}
              animation="fadeInUp"
              duration={600}
              style={styles.textContainer}
            >
              <CustomText style={styles.title}>{slide.title}</CustomText>
              <CustomText style={styles.subtitle}>{slide.subtitle}</CustomText>
            </Animatable.View>
          </View>

          <TouchableOpacity style={styles.continueBtn} onPress={goNext} activeOpacity={0.85}>
            <Icon
              name="arrow-left"
              size={hp(2.4)}
              color={COLORS.white}
              style={{ marginRight: 8 }}
            />

            <CustomText style={styles.continueBtnText}>
              {currentIndex === SLIDES.length - 1 ? 'ابدأ الآن' : 'التالي'}
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + hp(2.4) }} />
      </View>
    </ImageBackground>
  );
};

export default OnboardingScreen;
