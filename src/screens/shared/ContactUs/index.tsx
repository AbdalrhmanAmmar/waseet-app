import { CustomText, ScreenContainer } from '@/components/shared/index';
import { styles } from '@/screens/shared/ContactUs/styles';
import { COLORS, CONTACT_ITEMS, hp, Images } from '@/theme/index';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { Image, Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
export default function ContactUs({ navigation }: { navigation: any }) {
  const handleOpen = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Platform specific fallback: tel: usually fails canOpenURL on Simulators but might work on devices
        if (url.startsWith('tel:') || url.startsWith('whatsapp:')) {
          await Linking.openURL(url);
        } else {
          Toast.show({
            type: 'error',
            text1: 'تعذر الفتح',
            text2: 'حاول مرة أخرى أو تحقق من تثبيت التطبيق.',
          });
        }
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'خطأ',
        text2: 'تعذر فتح وسيلة التواصل. حاول مرة أخرى.',
      });
    }
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={hp(2.6)} color={COLORS.charcoal} />
        </TouchableOpacity>
        <CustomText style={styles.headerTitle}>تواصل معنا</CustomText>
        <View style={{ width: hp(4.2) }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Image
              source={Images.logoSelling}
              style={{ width: hp(8.2), height: hp(8.2) }}
              resizeMode="contain"
            />
          </View>
          <CustomText style={styles.heroTitle}>وسيط</CustomText>
          <CustomText style={styles.heroSubtitle}>
            للاستفسارات والمساعدة، تواصل مع فريق الدعم.
          </CustomText>
        </View>

        {/* Contact options */}
        {CONTACT_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.contactCard}
            activeOpacity={0.75}
            onPress={() => handleOpen(item.url)}
          >
            <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
              <Icon
                name={item.icon as React.ComponentProps<typeof Icon>['name']}
                size={hp(2.8)}
                color={item.iconColor}
              />
            </View>
            <View style={styles.contactInfo}>
              <CustomText style={styles.contactLabel}>{item.label}</CustomText>
              <CustomText style={styles.contactSubtitle}>{item.subtitle}</CustomText>
            </View>
            <Icon name="chevron-right" size={hp(2.4)} color="#CCC" />
          </TouchableOpacity>
        ))}

        {/* Info card */}
        <View style={styles.infoCard}>
          <Icon
            name="information-outline"
            size={hp(2.1)}
            color={COLORS.primary}
            style={{ marginBottom: 6 }}
          />
          <CustomText style={styles.infoText}>تواصل معنا للاستفسار عن حسابك أو طلباتك.</CustomText>
          <CustomText style={styles.infoText}>يمكنك متابعة حالة طلبك من صفحة الطلبات.</CustomText>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
